import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { useArgs } from 'storybook/preview-api';
import { expect, fn, waitFor } from 'storybook/test';

import { AllocationSplitter, type AllocationSplitterMode } from './AllocationSplitter';
import type { AllocationCategory } from './allocation';

const meta = {
  title: 'Allocation/Allocation Splitter',
  component: AllocationSplitter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onValueChange: fn(),
    onModeChange: fn(),
    onCategoriesChange: fn(),
  },
} satisfies Meta<typeof AllocationSplitter>;

export default meta;
type Story = StoryObj<typeof meta>;

// AllocationSplitter is fully controlled (value/mode/categories are all
// owned by the caller), so every story needs to actually apply the
// on*Change callbacks back onto its own args via useArgs — otherwise
// editing anything in the canvas would appear completely frozen.
function Render(args: Story['args']) {
  const [{ value, mode, categories }, updateArgs] = useArgs();
  return (
    <AllocationSplitter
      {...args}
      value={value}
      mode={mode}
      categories={categories}
      onValueChange={(nextValue) => {
        args.onValueChange?.(nextValue);
        updateArgs({ value: nextValue });
      }}
      onModeChange={(nextMode) => {
        args.onModeChange?.(nextMode);
        updateArgs({ mode: nextMode });
      }}
      onCategoriesChange={(nextCategories) => {
        args.onCategoriesChange?.(nextCategories);
        updateArgs({ categories: nextCategories });
      }}
    />
  );
}

// `useArgs`' `updateArgs` relies on Storybook's manager-preview channel to
// feed a change back down as new args — that channel isn't fully present
// when stories run headless via addon-vitest, so `Render` above doesn't
// actually re-render there (confirmed: onCategoriesChange fires with the
// correct redistributed data, but the DOM never reflects it in that
// environment). Play-function tests that need genuine multi-step state
// (like the announcement tests below, which depend on a real re-render to
// trigger the debounced effect) use plain useState instead, which works
// identically everywhere.
function StatefulRender(args: Story['args']) {
  const [value, setValue] = useState(args!.value!);
  const [mode, setMode] = useState(args!.mode);
  const [categories, setCategories] = useState<AllocationCategory[]>(args!.categories!);
  return (
    <AllocationSplitter
      {...args}
      value={value}
      mode={mode}
      categories={categories}
      onValueChange={(nextValue) => {
        args!.onValueChange?.(nextValue);
        setValue(nextValue);
      }}
      onModeChange={(nextMode: AllocationSplitterMode) => {
        args!.onModeChange?.(nextMode);
        setMode(nextMode);
      }}
      onCategoriesChange={(nextCategories) => {
        args!.onCategoriesChange?.(nextCategories);
        setCategories(nextCategories);
      }}
    />
  );
}

export const Primary: Story = {
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
  render: Render,
};

export const FreeForm: Story = {
  args: {
    ...Primary.args,
    mode: 'freeform',
  },
  render: Render,
};

export const ErrorPercentage: Story = {
  args: {
    ...Primary.args,
    categories: [
      { name: 'Profit', description: 'set aside first', percentage: 33.33, color: 'green-medium-dark' },
      { name: 'Expenses', description: 'set aside first', percentage: 66.70, color: 'orange-dark' },
    ],
  },
  render: Render,
};

// --- Accessibility: the debounced aria-live announcement ------------------
//
// axe-core (run via test:a11y) can confirm this region exists and is marked
// `aria-live="polite"` — it can't confirm the region says anything sensible,
// updates at the right time, or exists before the first announcement fires.
// These stories cover that gap with assertions on the region's actual
// content and timing. What they still can't cover: whether the phrasing
// reads naturally out loud — that needs an actual screen reader pass.

// The region must exist in the DOM (empty) from first paint. Injecting the
// region and its content at the same moment is a well-known screen-reader
// gotcha — many readers only start watching a live region once they've
// already seen it mounted, so if it appears *with* text already in it,
// that first announcement gets silently missed.
export const AnnouncementRegionPresentFromFirstPaint: Story = {
  args: { ...Primary.args },
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
  args: { ...Primary.args },
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

// The announcement is phrased as the settled result (every row plus the
// total), not the keystroke — and a locked row's lock state has to survive
// into that phrasing, since a screen reader user has no other way to
// discover that Taxes didn't move because it's locked.
export const AnnouncementIncludesLockAndTotal: Story = {
  args: { ...Primary.args },
  render: StatefulRender,
  play: async ({ canvas, userEvent }) => {
    const status = canvas.getByRole('status');
    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });

    await userEvent.clear(profitInput);
    await userEvent.type(profitInput, '20');

    await waitFor(() => expect(status).toHaveTextContent('Profit 20%'), { timeout: 2000 });
    // Taxes is locked and untouched by this edit, so its share and the
    // ", locked" qualifier are both exact and safe to assert on.
    await expect(status).toHaveTextContent('Taxes 15%, locked');
    // Proportional mode always resolves back to exactly 100.
    await expect(status).toHaveTextContent('Total 100%.');
  },
};

// Free-form mode lets the total drift away from 100 — the announcement has
// to say so explicitly (not just state a total a screen reader user can't
// visually compare against 100 themselves).
export const AnnouncementReflectsInvalidTotal: Story = {
  args: { ...Primary.args, mode: 'freeform' },
  render: StatefulRender,
  play: async ({ canvas, userEvent }) => {
    const status = canvas.getByRole('status');
    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });

    await userEvent.clear(profitInput);
    await userEvent.type(profitInput, '0');

    // Profit 5 -> 0 with nothing else redistributing (free-form) drops the
    // total from 100 to 95.
    await waitFor(
      () => expect(status).toHaveTextContent('Total 95%, 5% unallocated.'),
      { timeout: 2000 }
    );
  },
};

// --- Locking and mode switching --------------------------------------------

// Toggling a lock is a distinct code path from editing a percentage
// (toggleLock vs. applyPercentage), so it needs its own coverage: the
// callback must fire with only that row's isLocked flipped, and the UI must
// actually reflect it (the lock button's pressed state and the
// corresponding percentage input's disabled state), in both directions —
// granting a lock and releasing one.
export const TogglingLockUpdatesStateAndUI: Story = {
  args: { ...Primary.args },
  render: StatefulRender,
  play: async ({ args, canvas, userEvent }) => {
    // Profit starts unlocked: locking it shouldn't touch any other row.
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
    // The label itself flips to describe the new state (used by the
    // getByRole lookup above too — locked rows expose "Unlock ...").
    await expect(
      canvas.getByRole('button', { name: 'Unlock Profit (currently locked at 5 percent)' })
    ).toBeInTheDocument();

    // Taxes starts locked: releasing it shouldn't touch Profit's now-locked
    // state either.
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

// Switching modes has to do more than update the dropdown's own value — it
// has to actually change how subsequent edits behave (proportional
// redistributes siblings, free-form doesn't), otherwise the mode selector
// would be cosmetic.
export const ChangingModeSwitchesRedistributionBehavior: Story = {
  args: { ...Primary.args },
  render: StatefulRender,
  play: async ({ args, canvas, userEvent }) => {
    const modeSelect = canvas.getByLabelText('Mode');
    await expect(modeSelect).toHaveValue('proportional');

    await userEvent.selectOptions(modeSelect, 'freeform');

    await expect(args.onModeChange).toHaveBeenCalledWith('freeform');
    await expect(modeSelect).toHaveValue('freeform');

    // With the switch actually applied, editing Profit shouldn't redistribute
    // Owner's Pay anymore (it would drop from 50 in proportional mode).
    const profitInput = canvas.getByRole('textbox', { name: 'Percentage of Profit' });
    const ownersPayInput = canvas.getByRole('textbox', { name: "Percentage of Owner's Pay" });
    await userEvent.clear(profitInput);
    await userEvent.type(profitInput, '20');

    await waitFor(() => expect(profitInput).toHaveValue('20'));
    await expect(ownersPayInput).toHaveValue('50');
  },
};
