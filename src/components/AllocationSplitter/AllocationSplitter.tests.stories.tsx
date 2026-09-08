import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, waitFor } from 'storybook/test';
import { AllocationSplitter } from './AllocationSplitter';
import {
  defaultAllocationStrategies,
  type AllocationCategory,
  type AllocationRow,
  type AllocationStrategy,
  type AllocationStrategyMap,
} from './allocation';

const meta = {
  title: 'Allocation/Allocation Splitter/Tests',
  component: AllocationSplitter,
  parameters: {
    layout: 'centered',
  },
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

export const TogglingLockUpdatesStateAndUI: Story = {
  args: { ...Base.args },
  render: StatefulRender,
  play: async ({ args, canvas, userEvent }) => {
    const profitLock = canvas.getByRole('button', { name: 'Lock Profit at 5 percent' });
    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });
    await expect(profitLock).toHaveAttribute('aria-pressed', 'false');
    await expect(profitInput).toBeEnabled();

    await userEvent.click(profitLock);

    await expect(args.onCategoriesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: 'Profit', isLocked: true }),
      expect.objectContaining({ name: "Owner's Pay", isLocked: false }),
      expect.objectContaining({ name: 'Taxes', isLocked: true }),
      expect.objectContaining({ name: 'Operating Expenses', isLocked: false }),
    ]);
    await expect(profitLock).toHaveAttribute('aria-pressed', 'true');
    await expect(profitInput).toBeDisabled();

    await expect(
      canvas.getByRole('button', { name: 'Unlock Profit (currently locked at 5 percent)' })
    ).toBeInTheDocument();

    const taxesLock = canvas.getByRole('button', {
      name: 'Unlock Taxes (currently locked at 15 percent)',
    });
    await userEvent.click(taxesLock);

    await expect(args.onCategoriesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: 'Profit', isLocked: true }),
      expect.objectContaining({ name: "Owner's Pay", isLocked: false }),
      expect.objectContaining({ name: 'Taxes', isLocked: false }),
      expect.objectContaining({ name: 'Operating Expenses', isLocked: false }),
    ]);
    await expect(
      canvas.getByRole('button', { name: 'Lock Taxes at 15 percent' })
    ).toHaveAttribute('aria-pressed', 'false');
  },
};

export const ChangingStrategySwitchesRedistributionBehavior: Story = {
  args: { ...Base.args },
  render: StatefulRender,
  play: async ({ args, canvas, userEvent }) => {
    const strategySelect = canvas.getByLabelText('Strategy');
    await expect(strategySelect).toHaveValue('proportional');

    await userEvent.selectOptions(strategySelect, 'freeform');

    await expect(args.onStrategyChange).toHaveBeenCalledWith('freeform');
    await expect(strategySelect).toHaveValue('freeform');

    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });
    const ownersPayInput = canvas.getByRole('textbox', { name: "Percentage of Owner's Pay" });
    await userEvent.clear(profitInput);
    await userEvent.type(profitInput, '20');

    await waitFor(() => expect(profitInput).toHaveValue('20'));
    await expect(ownersPayInput).toHaveValue('50');
  },
};

/*
 * Accessibility
 */

/*
 * Accessibility: debounced aria-live announcement
 */

export const AnnouncementRegionPresentFromFirstPaint: Story = {
  args: { ...Base.args },
  render: StatefulRender,
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    await expect(status).toBeInTheDocument();
    await expect(status).toHaveTextContent('');
  },
};

// Edits are debounced 600ms so that typing "45" doesn't announce once for
// "4" and again for "45". Right after the second keystroke, the announcement
// must NOT have updated yet — only once things settle should it reflect the
// committed value.
export const AnnouncementIsDebounced: Story = {
  args: { ...Base.args },
  render: StatefulRender,
  play: async ({ canvas, userEvent }) => {
    const status = canvas.getByRole('status');
    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });

    await userEvent.clear(profitInput);
    await userEvent.type(profitInput, '45');
    await expect(status).toHaveTextContent('');

    await waitFor(() => expect(status).toHaveTextContent('Profit 45%'), { timeout: 2000 });
  },
};

export const AnnouncementIncludesLockAndTotal: Story = {
  args: { ...Base.args },
  render: StatefulRender,
  play: async ({ canvas, userEvent }) => {
    const status = canvas.getByRole('status');
    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });

    await userEvent.clear(profitInput);
    await userEvent.type(profitInput, '20');

    await waitFor(() => expect(status).toHaveTextContent('Profit 20%'), { timeout: 2000 });
    await expect(status).toHaveTextContent('Taxes 15%, locked');
    await expect(status).toHaveTextContent('Total 100%.');
  },
};

export const AnnouncementReflectsInvalidTotal: Story = {
  args: { ...Base.args, strategy: 'freeform' },
  render: StatefulRender,
  play: async ({ canvas, userEvent }) => {
    const status = canvas.getByRole('status');
    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });

    await userEvent.clear(profitInput);
    await userEvent.type(profitInput, '0');

    await waitFor(
      () => expect(status).toHaveTextContent('Total 95%, 5% unallocated.'),
      { timeout: 2000 }
    );
  },
};

/*
 * Custom allocation strategy
 */

const evenAllocation: AllocationStrategy = (rows, name, nextValue) => {
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

const evenStrategies: AllocationStrategyMap<'proportional' | 'even'> = {
  proportional: defaultAllocationStrategies.proportional,
  even: { label: 'Even', strategy: evenAllocation },
};

export const CustomStrategyIsUsedWhenSelected: Story = {
  args: {
    ...Base.args,
    strategies: evenStrategies,
    strategy: 'even',
  },
  render: StatefulRender,
  play: async ({ args, canvas, userEvent }) => {
    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });
    const ownersPayInput = canvas.getByRole('textbox', { name: "Percentage of Owner's Pay" });
    const expensesInput = canvas.getByRole('textbox', {
      name: 'Percentage of Operating Expenses',
    });

    await userEvent.clear(profitInput);
    await userEvent.type(profitInput, '20');

    await waitFor(() => expect(profitInput).toHaveValue('20'));
    await expect(ownersPayInput).toHaveValue('32.5');
    await expect(expensesInput).toHaveValue('32.5');

    await expect(args.onCategoriesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: 'Profit', percentage: 20 }),
      expect.objectContaining({ name: "Owner's Pay", percentage: 32.5 }),
      expect.objectContaining({ name: 'Taxes', percentage: 15 }),
      expect.objectContaining({ name: 'Operating Expenses', percentage: 32.5 }),
    ]);
  },
};

const clampSpy = fn((rows: AllocationRow[], name: string, nextValue: number) =>
  rows.map((row) => (row.name === name ? { ...row, percentage: nextValue } : row))
);

const clampSpyStrategies: AllocationStrategyMap<'only'> = {
  only: { label: 'Only', strategy: clampSpy },
};

export const CustomStrategyReceivesClampedValue: Story = {
  args: {
    value: 1_000,
    categories: [
      { name: 'A', percentage: 30, color: 'green-medium-dark' },
      { name: 'B', percentage: 70, color: 'blue-dark', isLocked: true },
    ],
    strategies: clampSpyStrategies,
    strategy: 'only',
  },
  render: StatefulRender,
  play: async ({ canvas, userEvent }) => {
    const aInput = canvas.getByRole('textbox', { name: 'Percentage of A' });

    // B is locked at 70, so A can never exceed 30 — the strategy should
    // receive 30, not the raw 90 that was typed. The input keeps showing
    // the uncommitted draft ("90") until blur, so that's asserted first.
    await userEvent.clear(aInput);
    await userEvent.type(aInput, '90');
    await expect(clampSpy).toHaveBeenLastCalledWith(expect.anything(), 'A', 30);

    await userEvent.tab();
    await waitFor(() => expect(aInput).toHaveValue('30'));
  },
};
