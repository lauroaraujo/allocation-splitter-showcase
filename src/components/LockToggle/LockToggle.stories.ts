import type { Meta, StoryObj } from '@storybook/react-vite';

import { expect, fn } from 'storybook/test';

import { LockToggle } from './LockToggle';

const meta = {
  title: 'Controls/Lock Toggle',
  component: LockToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: { onClick: fn() },
} satisfies Meta<typeof LockToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Locked: Story = {
  args: {
    isLocked: true,
    unlockActionLabel: 'Click to unlock'
  },
};

export const Unlocked: Story = {
  args: {
    isLocked: false,
    lockActionLabel: 'Click to lock'
  },
};

export const Click: Story = {
  args: {
    isLocked: false,
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Lock' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
