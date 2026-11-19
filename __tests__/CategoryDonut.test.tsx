import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import { Circle } from 'react-native-svg';
import { CategoryDonut } from '../src/components/CategoryDonut';
import { CategoryBreakdown } from '../src/types';

// Loading the native SVG host components can exceed Jest's default on Windows.
jest.setTimeout(20_000);

function item(id: string, total: number, share: number): CategoryBreakdown {
  return {
    category: { id, label: id, kind: 'debit', emoji: '', color: '#008F83' },
    count: 1,
    total,
    share,
  };
}

async function render(data: CategoryBreakdown[], onPress = jest.fn()) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <CategoryDonut data={data} label="مجموع خرج" onPress={onPress} />,
    );
  });
  return { renderer, onPress };
}

test('both ring and legend open the matching category after a filter changes', async () => {
  const { renderer, onPress } = await render([
    item('food', 80, 80),
    item('shopping', 20, 20),
  ]);
  act(() => renderer.root.findAllByType(Circle)[2].props.onPress());
  expect(onPress).toHaveBeenLastCalledWith('shopping');
  await act(async () => {
    renderer.update(
      <CategoryDonut
        data={[item('salary', 100, 100)]}
        label="مجموع درآمد"
        onPress={onPress}
      />,
    );
  });
  act(() => renderer.root.findByType(TouchableOpacity).props.onPress());
  expect(onPress).toHaveBeenLastCalledWith('salary');
  act(() => renderer.unmount());
});

test('a single category fills a complete ring', async () => {
  const { renderer } = await render([item('food', 10, 100)]);
  const slice = renderer.root.findAllByType(Circle)[1];
  expect(slice.props.strokeDasharray[0]).toBeCloseTo(
    2 * Math.PI * slice.props.r,
  );
  expect(slice.props.strokeDasharray[1]).toBe(0);
  act(() => renderer.unmount());
});

test('tiny categories remain visible without exaggerating their amount', async () => {
  const { renderer } = await render([
    item('large', 9999, 99.99),
    item('tiny', 1, 0.01),
  ]);
  const slices = renderer.root.findAllByType(Circle).slice(1);
  const circumference = 2 * Math.PI * slices[1].props.r;
  const tinyArc = slices[1].props.strokeDasharray[0];
  expect(tinyArc).toBeGreaterThan(0);
  expect(tinyArc).toBeLessThanOrEqual(circumference / 10000);
  expect(renderer.root.findAllByType(TouchableOpacity)).toHaveLength(2);
  act(() => renderer.unmount());
});

test('empty and zero amounts produce an empty ring without invalid geometry', async () => {
  const { renderer } = await render([item('zero', 0, 0)]);
  expect(renderer.root.findAllByType(Circle)).toHaveLength(1);
  expect(renderer.root.findAllByType(TouchableOpacity)).toHaveLength(0);
  expect(JSON.stringify(renderer.toJSON())).not.toMatch(/NaN|Infinity/);
  act(() => renderer.unmount());
});
