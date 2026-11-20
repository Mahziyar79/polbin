import { NativeModules } from 'react-native';
import { fetchPendingSms, removePendingSms, removePendingSmsBatch } from '../src/services/pendingSms';
import { parseSms } from '../src/services/smsParser';

afterEach(() => { delete NativeModules.PolbinPendingSms; });

test('batch deletion passes unique IDs to one native write', async () => {
  const remove = jest.fn().mockResolvedValue(true);
  NativeModules.PolbinPendingSms = { removePendingSmsBatch: remove };
  await removePendingSmsBatch(['first', 'second', 'first']);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(JSON.parse(remove.mock.calls[0][0])).toEqual(['first', 'second']);
});

test('batch deletion never reports success when the native operation fails', async () => {
  NativeModules.PolbinPendingSms = { removePendingSmsBatch: jest.fn().mockResolvedValue(false) };
  await expect(removePendingSmsBatch(['first'])).rejects.toThrow();
});

test('native queue is returned with its original receipt time', async () => {
  const item = { id: 'first', rawSms: 'بانک ملت برداشت 250000 ریال', receivedAt: 1_700_000_000_000 };
  NativeModules.PolbinPendingSms = { getPendingSms: jest.fn().mockResolvedValue(JSON.stringify([item])) };
  await expect(fetchPendingSms()).resolves.toEqual([item]);
});

test('malformed native records are rejected instead of displaying an incorrect empty inbox', async () => {
  NativeModules.PolbinPendingSms = { getPendingSms: jest.fn().mockResolvedValue('[{"id":"bad"}]') };
  await expect(fetchPendingSms()).rejects.toThrow();
});

test('queue write failures are observable by the caller', async () => {
  NativeModules.PolbinPendingSms = { removePendingSms: jest.fn().mockRejectedValue(new Error('disk full')) };
  await expect(removePendingSms('first')).rejects.toThrow('disk full');
});

test('an SMS without a date keeps its receipt date when opened days later', () => {
  const received = new Date('2026-09-12T08:30:00.000Z');
  expect(parseSms('بانک ملت برداشت مبلغ 250000 ریال حساب 1234', received).date).toBe(received.toISOString());
});

test('an SMS containing only a time uses the receipt day', () => {
  const received = new Date(2026, 8, 12, 10, 0);
  const date = new Date(parseSms('بانک ملت برداشت مبلغ 250000 ریال حساب 1234 ساعت 08:32', received).date);
  expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()])
    .toEqual([2026, 8, 12, 8, 32]);
});
