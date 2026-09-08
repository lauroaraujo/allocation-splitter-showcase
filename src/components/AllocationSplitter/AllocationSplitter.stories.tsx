import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { AllocationSplitter } from './AllocationSplitter';
import {
  freeformAllocation,
  type AllocationCategory,
  type AllocationStrategy,
  type AllocationStrategyMap,
} from './allocation';

const meta = {
  title: 'Allocation/Allocation Splitter',
  component: AllocationSplitter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onValueChange: fn(),
    onStrategyChange: fn(),
    onCategoriesChange: fn(),
  },
} satisfies Meta<typeof AllocationSplitter>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulRender(args: Story['args']) {
  const [value, setValue] = useState(args!.value!);
  const [strategy, setStrategy] = useState(args!.strategy);
  const [categories, setCategories] = useState<AllocationCategory[]>(args!.categories!);
  return (
    <AllocationSplitter
      {...args}
      value={value}
      strategy={strategy}
      categories={categories}
      onValueChange={(nextValue) => {
        args!.onValueChange?.(nextValue);
        setValue(nextValue);
      }}
      onStrategyChange={(nextStrategy) => {
        args!.onStrategyChange?.(nextStrategy);
        setStrategy(nextStrategy);
      }}
      onCategoriesChange={(nextCategories) => {
        args!.onCategoriesChange?.(nextCategories);
        setCategories(nextCategories);
      }}
    />
  );
}

const Base: Story = {
  args: {
    value: 100_000_000,
    categories: [
      { name: 'Profit', description: 'set aside first', percentage: 5, color: 'green-medium-dark' },
      { name: "Owner's Pay", description: 'your salary', percentage: 50, color: 'blue-dark' },
      {
        name: 'Taxes',
        description: 'quarterly remittance',
        percentage: 15,
        color: 'amber-medium-dark',
        isLocked: true,
      },
      {
        name: 'Operating Expenses',
        description: 'everything else',
        percentage: 30,
        color: 'orange-dark',
      },
    ],
  },
  render: StatefulRender,
};

export const Proportional: Story = {
  args: {
    ...Base.args,
  },
  render: StatefulRender,
};

export const FreeForm: Story = {
  args: {
    ...Base.args,
    strategy: 'freeform',
  },
  render: StatefulRender,
};

export const Simple: Story = {
  args: {
    ...Base.args,
    showBar: false,
    showTotal: false,
    showStrategySelector: false,
    valueInputMode: 'hidden',
  },
  render: StatefulRender,
}

export const ErrorPercentage: Story = {
  args: {
    ...Base.args,
    categories: [
      { name: 'Profit', description: 'set aside first', percentage: 33.33, color: 'green-medium-dark' },
      { name: 'Expenses', description: 'set aside first', percentage: 66.70, color: 'orange-dark' },
    ],
  },
  render: StatefulRender,
};

// Splits whatever's left after the edited row evenly across the other
// unlocked rows (locked ones keep their share) — a custom strategy the
// library doesn't provide, mixed with the built-in "Freeform" here to show
// that a `strategies` map isn't limited to the two defaults.
const evenSplit: AllocationStrategy = (rows, name, nextValue) => {
  const pool = rows.filter((row) => row.name !== name && !row.isLocked);
  const lockedTotal = rows
    .filter((row) => row.name !== name && row.isLocked)
    .reduce((sum, row) => sum + row.percentage, 0);
  const share = pool.length > 0 ? (100 - nextValue - lockedTotal) / pool.length : 0;

  return rows.map((row) => {
    if (row.name === name) return { ...row, percentage: nextValue };
    if (row.isLocked) return row;
    return { ...row, percentage: share };
  });
};

const customStrategies: AllocationStrategyMap<'even' | 'freeform'> = {
  even: { label: 'Even Split', strategy: evenSplit },
  freeform: { label: 'Freeform', strategy: freeformAllocation },
};

// The dropdown renders one option per entry in `strategies` — here "Even
// Split" and "Freeform" — instead of the built-in "Proportional"/"Freeform"
// pair, since passing a custom map replaces the defaults entirely.
export const CustomStrategies: Story = {
  args: {
    ...Base.args,
    strategies: customStrategies,
    strategy: 'even',
  },
  render: StatefulRender,
};
