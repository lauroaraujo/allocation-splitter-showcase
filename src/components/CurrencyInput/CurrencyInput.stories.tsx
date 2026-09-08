import type { Meta, StoryObj } from '@storybook/react-vite';

import { useArgs } from 'storybook/preview-api';
import { expect, fn } from 'storybook/test';

import { CurrencyInput } from './CurrencyInput';

const meta = {
  title: 'Controls/Currency Input',
  component: CurrencyInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: { onCommit: fn() },
} satisfies Meta<typeof CurrencyInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'currency-input-default',
    'aria-label': 'Amount',
    amount: 100,
  },
};

export const LargeAmount: Story = {
  args: {
    id: 'currency-input-large',
    'aria-label': 'Amount',
    amount: 100_000_000,
  },
};

export const Disabled: Story = {
  args: {
    id: 'currency-input-disabled',
    'aria-label': 'Amount',
    amount: 100,
    disabled: true,
  },
};

export const Typing: Story = {
  args: {
    id: 'currency-input-typing',
    'aria-label': 'Amount',
    amount: 10.23,
  },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByDisplayValue('10.23');
    await userEvent.type(input, '{backspace}');
    await expect(args.onCommit).toHaveBeenCalledWith(10.2);
    await userEvent.type(input, '9');
    await expect(args.onCommit).toHaveBeenCalledWith(10.29);
  },
};

export const Interactive: Story = {
  args: {
    id: 'currency-input-interactive',
    'aria-label': 'Amount',
    amount: 1234.5,
  },
  render: function Render(args) {
    const [{ amount }, updateArgs] = useArgs();
    return (
      <CurrencyInput
        {...args}
        amount={amount}
        onCommit={(nextValue) => {
          args.onCommit(nextValue);
          updateArgs({ amount: nextValue });
        }}
      />
    );
  },
};
