import type { Meta, StoryObj } from '@storybook/react-vite';

import { expect, fn } from 'storybook/test';

import { Button } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs', 'ai-generated'],
  // More on argTypes: https://storybook.js.org/docs/api/arg-types
  argTypes: {
    backgroundColor: { control: 'color' },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: args.label });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary: Story = {
  args: {
    label: 'Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: 'Button',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: 'Button',
  },
};

// storybook-button--primary sets background-color: #555ab9 in Button.css — fails if that stylesheet didn't load.
export const CssCheck: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: args.label });
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(85, 90, 185)');
  },
};
