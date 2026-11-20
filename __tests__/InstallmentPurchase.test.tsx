import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { FormFooter } from '../src/components/FormFooter';
import { PickerSheet } from '../src/components/PickerSheet';
import { TextInput } from '../src/components/TextInput';
import { AddInstallmentScreen } from '../src/screens/AddInstallmentScreen';
import { InstallmentsProvider, useInstallments } from '../src/state/InstallmentsContext';
import { storage, STORAGE_KEYS } from '../src/services/storage';
import { nextUnpaid, remainingAmount } from '../src/services/installments';

jest.setTimeout(30_000);
beforeEach(() => storage.clearAll());

async function mount(id?: string) {
  let value!: ReturnType<typeof useInstallments>;
  const goBack = jest.fn();
  function Probe() { value = useInstallments(); return null; }
  const props = { navigation: { goBack }, route: { params: { id } } } as unknown as React.ComponentProps<typeof AddInstallmentScreen>;
  let renderer!: Renderer.ReactTestRenderer;
  await act(async () => {
    renderer = Renderer.create(
      <SafeAreaInsetsContext.Provider value={{ top: 0, bottom: 0, left: 0, right: 0 }}>
        <InstallmentsProvider><Probe /><AddInstallmentScreen {...props} /></InstallmentsProvider>
      </SafeAreaInsetsContext.Provider>,
    );
  });
  return { renderer, goBack, get value() { return value; } };
}

function field(app: Awaited<ReturnType<typeof mount>>, label: string) {
  return app.renderer.root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === label)!;
}
async function more(app: Awaited<ReturnType<typeof mount>>) {
  await act(async () => app.renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'تنظیمات بیشتر')!.props.onPress());
}

test('خرید موبایل بدون بانک، با سه پرداخت قبلی و حفظ پس از بازخوانی', async () => {
  const app = await mount();
  await more(app);
  await act(async () => {
    field(app, 'عنوان').props.onChangeText('موبایل');
    field(app, 'فروشگاه یا دریافت‌کننده').props.onChangeText('دیجی‌کالا');
    field(app, 'مبلغ هر قسط').props.onChangeText('۳۰۰۰۰۰۰');
    field(app, 'تعداد اقساط').props.onChangeText('۱۲');
    field(app, 'تعداد اقساط پرداخت‌شدهٔ قبلی').props.onChangeText('۳');
  });
  expect(app.renderer.root.findByType(FormFooter).props.disabled).toBe(false);
  await act(async () => app.renderer.root.findByType(FormFooter).props.onSubmit());
  expect(app.goBack).toHaveBeenCalledTimes(1);
  expect(app.value.installments[0]).toMatchObject({ title: 'موبایل', kind: 'purchase', counterparty: 'دیجی‌کالا', amount: 3_000_000, count: 12, paid: [1, 2, 3] });
  expect(app.value.installments[0].bank).toBeUndefined();
  expect(nextUnpaid(app.value.installments[0])?.number).toBe(4);
  expect(remainingAmount(app.value.installments[0])).toBe(27_000_000);
  await act(async () => app.renderer.unmount());
  const restored = await mount();
  expect(restored.value.installments[0].counterparty).toBe('دیجی‌کالا');
  await act(async () => restored.value.togglePaid(restored.value.installments[0].id, 4));
  expect(restored.value.installments[0].paid).toEqual([1, 2, 3, 4]);
  expect(storage.getString(STORAGE_KEYS.transactions)).toBeUndefined();
  await act(async () => restored.renderer.unmount());
});

test('پرداخت قبلی بیشتر از تعداد اقساط قابل ثبت نیست', async () => {
  const app = await mount();
  await more(app);
  await act(async () => {
    field(app, 'عنوان').props.onChangeText('موبایل');
    field(app, 'مبلغ هر قسط').props.onChangeText('۳۰۰۰۰۰۰');
    field(app, 'تعداد اقساط').props.onChangeText('۱۲');
    field(app, 'تعداد اقساط پرداخت‌شدهٔ قبلی').props.onChangeText('۱۳');
  });
  expect(app.renderer.root.findByType(FormFooter).props.disabled).toBe(true);
  await act(async () => app.renderer.root.findByType(FormFooter).props.onSubmit());
  expect(app.value.installments).toEqual([]);
  expect(app.goBack).not.toHaveBeenCalled();
  await act(async () => app.renderer.unmount());
});

test('انتخاب وام، گزینهٔ بانک را نشان می‌دهد', async () => {
  const app = await mount();
  const loan = app.renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'وام')!;
  await act(async () => loan.props.onPress());
  expect(app.renderer.root.findAllByType(TouchableOpacity).some(node => node.props.accessibilityState?.checked && node.props.accessibilityLabel === 'وام')).toBe(true);
  const picker = app.renderer.root.findByType(PickerSheet);
  await act(async () => picker.props.onSelect('بانک ملت'));
  await more(app);
  await act(async () => {
    field(app, 'عنوان').props.onChangeText('وام مسکن');
    field(app, 'مبلغ هر قسط').props.onChangeText('۳۰۰۰۰۰۰');
    field(app, 'تعداد اقساط').props.onChangeText('۱۲');
  });
  await act(async () => app.renderer.root.findByType(FormFooter).props.onSubmit());
  expect(app.value.installments[0]).toMatchObject({ kind: 'loan', bank: 'بانک ملت' });
  await act(async () => app.renderer.unmount());
});

test('ویرایش رکورد قدیمی، پرداخت‌های غیرمتوالی و بانک آن را حفظ می‌کند', async () => {
  const old = { id: 'legacy', title: 'قدیمی', amount: 1_000_000, count: 12, paid: [1, 3, 5], firstDueDate: '2026-09-01T00:00:00.000Z', bank: 'بانک ملت' };
  storage.set(STORAGE_KEYS.installments, JSON.stringify([old]));
  const app = await mount('legacy');
  await act(async () => app.renderer.root.findAllByType(TextInput)[0].props.onChangeText('عنوان تازه'));
  await act(async () => app.renderer.root.findByType(FormFooter).props.onSubmit());
  expect(app.value.installments[0]).toEqual({ ...old, title: 'عنوان تازه' });
  await act(async () => app.renderer.unmount());
});


test('فرم کوتاه، جزئیات اختیاری را پنهان می‌کند و چک فقط یک سررسید دارد', async () => {
  const app = await mount();
  expect(field(app, 'فروشگاه یا دریافت‌کننده')).toBeUndefined();
  const cheque = app.renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'چک')!;
  await act(async () => cheque.props.onPress());
  expect(field(app, 'تعداد اقساط')).toBeUndefined();
  await act(async () => {
    field(app, 'عنوان').props.onChangeText('چک خرید');
    field(app, 'مبلغ چک').props.onChangeText('۹۰۰۰۰۰۰');
  });
  await more(app);
  await act(async () => {
    field(app, 'فروشگاه یا دریافت‌کننده').props.onChangeText('فروشگاه');
    field(app, 'شماره چک').props.onChangeText('۰۰۱۲۳۴');
  });
  await act(async () => app.renderer.root.findByType(FormFooter).props.onSubmit());
  expect(app.value.installments[0]).toMatchObject({ kind: 'cheque', count: 1, amount: 9_000_000, paid: [], chequeNumber: '001234' });
  const { expand, dueInJalaliMonth, unpaidThisMonth } = jest.requireActual('../src/services/installments');
  const chequePlan = app.value.installments[0];
  const now = new Date(chequePlan.firstDueDate);
  expect(expand(chequePlan)).toHaveLength(1);
  expect(dueInJalaliMonth([chequePlan], 1, now)).toHaveLength(0);
  expect(unpaidThisMonth([chequePlan], now)).toBe(9_000_000);
  await act(async () => app.value.togglePaid(chequePlan.id, 1));
  expect(unpaidThisMonth(app.value.installments, now)).toBe(0);
  expect(storage.getString(STORAGE_KEYS.transactions)).toBeUndefined();
  await act(async () => app.renderer.unmount());
});
