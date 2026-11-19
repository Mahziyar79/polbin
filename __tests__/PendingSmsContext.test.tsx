import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { PendingSmsProvider, usePendingSms } from '../src/state/PendingSmsContext';
import { TransactionsProvider } from '../src/state/TransactionsContext';
import { fetchPendingSms, removePendingSms, PendingSms } from '../src/services/pendingSms';
import { storage, STORAGE_KEYS } from '../src/services/storage';

jest.mock('../src/services/pendingSms', () => ({
  fetchPendingSms: jest.fn(), removePendingSms: jest.fn(),
  subscribeToPendingSms: jest.fn(() => () => {}),
}));
jest.setTimeout(20_000);
const fetchMock = jest.mocked(fetchPendingSms);
const removeMock = jest.mocked(removePendingSms);
const first: PendingSms = { id: 'first', rawSms: 'first SMS', receivedAt: 1000 };
const second: PendingSms = { id: 'second', rawSms: 'second SMS', receivedAt: 2000 };

beforeEach(() => {
  storage.clearAll();
  fetchMock.mockReset().mockResolvedValue([]);
  removeMock.mockReset().mockResolvedValue(undefined);
});

async function mount() {
  let value!: ReturnType<typeof usePendingSms>;
  function Probe() { value = usePendingSms(); return null; }
  let renderer!: Renderer.ReactTestRenderer;
  await act(async () => {
    renderer = Renderer.create(<TransactionsProvider><PendingSmsProvider><Probe /></PendingSmsProvider></TransactionsProvider>);
  });
  return { get value() { return value; }, unmount: () => act(() => renderer.unmount()) };
}

test('viewing or refreshing the inbox preserves pending items; dismiss removes only the selected one', async () => {
  let persisted = [first, second];
  fetchMock.mockImplementation(async () => [...persisted]);
  removeMock.mockImplementation(async id => { persisted = persisted.filter(item => item.id !== id); });
  const app = await mount();
  await act(async () => { await app.value.refresh(); });
  expect(app.value.items).toEqual([first, second]);
  expect(removeMock).not.toHaveBeenCalled();
  await act(async () => { await app.value.dismiss(first.id); });
  expect(app.value.items).toEqual([second]);
  expect(persisted).toEqual([second]);
  app.unmount();
});

test('a durable transaction removes its leftover queue record after a restart', async () => {
  storage.set(STORAGE_KEYS.transactions, JSON.stringify([{
    id: 'tx-first', sourceSmsId: first.id, amount: 100, merchant: 'x', categoryId: 'other',
    type: 'debit', date: '2026-09-12T08:00:00.000Z',
  }]));
  fetchMock.mockResolvedValue([first, second]);
  const app = await mount();
  expect(removeMock).toHaveBeenCalledWith(first.id);
  expect(app.value.items).toEqual([second]);
  app.unmount();
});

test('a delayed old refresh cannot replace the newest inbox snapshot', async () => {
  const app = await mount();
  let resolveOld!: (value: PendingSms[]) => void;
  let resolveNew!: (value: PendingSms[]) => void;
  fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
    .mockImplementationOnce(() => new Promise(resolve => { resolveNew = resolve; }));
  let oldRequest!: Promise<PendingSms[]>;
  let newRequest!: Promise<PendingSms[]>;
  await act(async () => { oldRequest = app.value.refresh(); newRequest = app.value.refresh(); });
  await act(async () => { resolveNew([second]); await newRequest; });
  await act(async () => { resolveOld([first]); await oldRequest; });
  expect(app.value.items).toEqual([second]);
  app.unmount();
});

test('read failure keeps the previous inbox and a successful retry clears the error', async () => {
  fetchMock.mockResolvedValue([first]);
  const app = await mount();
  fetchMock.mockRejectedValueOnce(new Error('unavailable'));
  await act(async () => { await expect(app.value.refresh()).rejects.toThrow(); });
  expect(app.value.items).toEqual([first]);
  expect(app.value.error).toBeTruthy();
  await act(async () => { await app.value.refresh(); });
  expect(app.value.error).toBeNull();
  app.unmount();
});
