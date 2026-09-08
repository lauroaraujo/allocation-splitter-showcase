import type { Meta, StoryObj } from '@storybook/react-vite';

import { PALETTE, type PaletteHue, type PaletteTier, type PaletteColor } from './colorPalette';

const HUES: PaletteHue[] = [
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
];

const TIERS: PaletteTier[] = ['light', 'medium-light', 'medium-dark', 'dark'];

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const ColorPaletteGrid = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `100px repeat(${TIERS.length}, 1fr)`,
      gap: 8,
      fontFamily: FONT_FAMILY,
    }}
  >
    <div />
    {TIERS.map((tier) => (
      <div key={tier} style={{ fontSize: 12, fontWeight: 600, color: '#666', textAlign: 'center' }}>
        {tier}
      </div>
    ))}
    {HUES.flatMap((hue) => [
      <div key={`${hue}-label`} style={{ fontSize: 14, fontWeight: 600, alignSelf: 'center' }}>
        {hue}
      </div>,
      ...TIERS.map((tier) => {
        const token = `${hue}-${tier}` as PaletteColor;
        const { background, text } = PALETTE[token];
        return (
          <div
            key={token}
            style={{
              backgroundColor: background,
              color: text,
              borderRadius: 8,
              padding: '14px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600 }}>{token}</div>
            <div style={{ fontSize: 11, fontFamily: 'SF Mono, Menlo, Consolas, monospace' }}>
              {background}
            </div>
          </div>
        );
      }),
    ])}
  </div>
);

const meta = {
  title: 'Foundations/Color Palette',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const AllColors: Story = {
  render: () => <ColorPaletteGrid />,
};
