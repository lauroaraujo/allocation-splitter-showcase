import type { Meta, StoryObj } from '@storybook/react-vite';

import { AllocationBar } from './AllocationBar';

const meta = {
  title: 'Allocation/Allocation Bar',
  component: AllocationBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AllocationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullyAllocated: Story = {
  args: {
    segments: [
      { name: 'Profit', percentage: 5, color: 'green-medium-dark' },
      { name: "Owner's Pay", percentage: 50, color: 'blue-dark' },
      { name: 'Taxes', percentage: 15, color: 'amber-medium-dark' },
      { name: 'Operating Expenses', percentage: 30, color: 'orange-dark' },
    ],
  },
};

export const Underallocated: Story = {
  args: {
    segments: [
      { name: 'Profit', percentage: 5, color: 'green-medium-dark' },
      { name: "Owner's Pay", percentage: 40, color: 'blue-dark' },
      { name: 'Taxes', percentage: 15, color: 'amber-medium-dark' },
    ],
    isValid: false,
  },
};

export const Overallocated: Story = {
  args: {
    segments: [
      { name: 'Profit', percentage: 20, color: 'green-medium-dark' },
      { name: "Owner's Pay", percentage: 60, color: 'blue-dark' },
      { name: 'Taxes', percentage: 30, color: 'amber-medium-dark' },
    ],
    isValid: false,
  },
};

export const SlightlyOverallocated: Story = {
  args: {
    segments: [
      { name: 'Profit', percentage: 20, color: 'green-medium-dark' },
      { name: "Owner's Pay", percentage: 50, color: 'blue-dark' },
      { name: 'Taxes', percentage: 30.5, color: 'amber-medium-dark' },
    ],
    isValid: false,
  },
};

export const WithSmallSegments: Story = {
  args: {
    segments: [
      { name: 'Profit', percentage: 3, color: 'green-medium-dark' },
      { name: "Owner's Pay", percentage: 50, color: 'blue-dark' },
      { name: 'Taxes', percentage: 15, color: 'amber-medium-dark' },
      { name: 'Misc', percentage: 2, color: 'purple-medium-dark' },
      { name: 'Operating Expenses', percentage: 30, color: 'orange-dark' },
    ],
  },
};
