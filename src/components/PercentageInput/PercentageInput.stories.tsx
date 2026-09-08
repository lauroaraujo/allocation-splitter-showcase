import type { Meta, StoryObj } from '@storybook/react-vite';

import { useArgs } from 'storybook/preview-api';
import { expect, fn } from 'storybook/test';

import { PercentageInput } from './PercentageInput';

const meta = {
  title: 'Controls/Percentage Input',
  component: PercentageInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: { onCommit: fn() },
} satisfies Meta<typeof PercentageInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    id: 'percentage-input-interactive',
    'aria-label': 'Percentage',
    percentage: 33.33,
    maxDecimals: 2,
  },
  render: function Render(args) {
    const [{ percentage }, updateArgs] = useArgs();
    return (
      <PercentageInput
        {...args}
        percentage={percentage}
        onCommit={(nextValue) => {
          args.onCommit(nextValue);
          updateArgs({ percentage: nextValue });
        }}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    id: 'percentage-input-disabled',
    'aria-label': 'Percentage',
    percentage: 15,
    disabled: true,
  },
};

export const Typing: Story = {
  args: {
    id: 'percentage-input-typing',
    'aria-label': 'Percentage',
    percentage: 5,
  },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('5');
    await userEvent.type(input, '0');
    await expect(args.onCommit).toHaveBeenCalledWith(50);
  },
};

export const CommitsOnBlurAndClearsDraft: Story = {
  args: {
    id: 'percentage-input-blur',
    'aria-label': 'Percentage',
    percentage: 12,
  },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('12');
    await userEvent.type(input, '.5');
    await expect(input).toHaveValue('12.5');
    await expect(args.onCommit).toHaveBeenCalledWith(12.5);

    await userEvent.tab();
    await expect(input).toHaveValue('12');
  },
};

/*
 * Keyboard Stories
 */

export const ArrowUpIncrementsByOne: Story = {
  args: { id: 'percentage-input-arrow-up', 'aria-label': 'Percentage', percentage: 10 },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('10');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    await expect(args.onCommit).toHaveBeenCalledWith(11);
  },
};

// Shift steps by 10 instead of 1.
export const ShiftArrowUpIncrementsByTen: Story = {
  args: { id: 'percentage-input-shift-arrow-up', 'aria-label': 'Percentage', percentage: 10 },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('10');
    await userEvent.click(input);
    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}');
    await expect(args.onCommit).toHaveBeenCalledWith(20);
  },
};

export const ArrowDownDecrementsByOne: Story = {
  args: { id: 'percentage-input-arrow-down', 'aria-label': 'Percentage', percentage: 10 },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('10');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onCommit).toHaveBeenCalledWith(9);
  },
};

export const ShiftArrowDownDecrementsByTen: Story = {
  args: { id: 'percentage-input-shift-arrow-down', 'aria-label': 'Percentage', percentage: 10 },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('10');
    await userEvent.click(input);
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await expect(args.onCommit).toHaveBeenCalledWith(0);
  },
};

export const HomeCommitsZero: Story = {
  args: { id: 'percentage-input-home', 'aria-label': 'Percentage', percentage: 42 },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('42');
    await userEvent.click(input);
    await userEvent.keyboard('{Home}');
    await expect(args.onCommit).toHaveBeenCalledWith(0);
  },
};

export const EndCommits100: Story = {
  args: { id: 'percentage-input-end', 'aria-label': 'Percentage', percentage: 42 },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('42');
    await userEvent.click(input);
    await userEvent.keyboard('{End}');
    await expect(args.onCommit).toHaveBeenCalledWith(100);
  },
};

export const UnhandledKeyDoesNotCommit: Story = {
  args: { id: 'percentage-input-unhandled-key', 'aria-label': 'Percentage', percentage: 42 },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('42');
    await userEvent.click(input);
    await userEvent.keyboard('{Enter}');
    await expect(args.onCommit).not.toHaveBeenCalled();
  },
};
