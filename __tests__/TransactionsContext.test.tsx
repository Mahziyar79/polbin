import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { TransactionsProvider, useTransactions } from '../src/state/TransactionsContext';
import { storage, STORAGE_KEYS } from '../src/services/storage';
import { Transaction } from '../src/types';

jest.setTimeout(20_000);
beforeEach(() => { storage.clearAll(); });
afterEach(() => { jest.restoreAllMocks(); });

const input: Omit<Transaction, 'id'> = {
  amount: 25_000, merchant: 'test', categoryId: 'other', type: 'debit',
  date: '2026-09-12T08:00:00.000Z', sourceSmsId: 'sms-first',
};

async function mount() {
  let value!: ReturnType<typeof useTransactions>;
  function Probe() { value = useTransactions(); return null; }
  let renderer!: Renderer.ReactTestRenderer;
  await act(async () => { renderer = Renderer.create(<TransactionsProvider><Probe /></TransactionsProvider>); });
  return { get value() { return value; }, unmount: () => act(() => renderer.unmount()) };
}

test('concurrent confirmations of the same pending SMS create one durable transaction', async () => {
  const app = await mount();
  let results!: Transaction[];
  await act(async () => { results = await Promise.all([app.value.addTransaction(input), app.value.addTransaction(input)]); });
  expect(results[0].id).toBe(results[1].id);
  expect(app.value.transactions).toHaveLength(1);
  expect(JSON.parse(storage.getString(STORAGE_KEYS.transactions)!)).toHaveLength(1);
  app.unmount();
});

test('retry after restarting the app does not duplicate an already committed SMS', async () => {
  const first = await mount();
  let saved!: Transaction;
  await act(async () => { saved = await first.value.addTransaction(input); });
  first.unmount();
  const restored = await mount();
  let retried!: Transaction;
  await act(async () => { retried = await restored.value.addTransaction(input); });
  expect(retried.id).toBe(saved.id);
  expect(restored.value.transactions).toHaveLength(1);
  restored.unmount();
});

test('a failed write rejects confirmation without adding an in-memory-only transaction', async () => {
  const app = await mount();
  jest.spyOn(storage, 'set').mockImplementationOnce(() => { throw new Error('disk full'); });
  await act(async () => { await expect(app.value.addTransaction(input)).rejects.toThrow('disk full'); });
  expect(app.value.transactions).toHaveLength(0);
  expect(storage.getString(STORAGE_KEYS.transactions)).toBeUndefined();
  await act(async () => { await app.value.addTransaction(input); });
  expect(app.value.transactions).toHaveLength(1);
  app.unmount();
});

test('different pending SMS and manual transactions are not collapsed', async () => {
  const app = await mount();
  await act(async () => {
    await Promise.all([
      app.value.addTransaction(input),
      app.value.addTransaction({ ...input, sourceSmsId: 'sms-second' }),
      app.value.addTransaction({ ...input, sourceSmsId: undefined }),
      app.value.addTransaction({ ...input, sourceSmsId: undefined }),
    ]);
  });
  expect(app.value.transactions).toHaveLength(4);
  app.unmount();
});
