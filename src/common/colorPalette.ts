export type PaletteHue =
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink';

export type PaletteTier = 'light' | 'medium-light' | 'medium-dark' | 'dark';

export type PaletteColor = `${PaletteHue}-${PaletteTier}`;

export const TEXT_LIGHT = '#ffffff';
export const TEXT_DARK = '#000000';

type PaletteEntry = {
  background: string;
  text: typeof TEXT_DARK | typeof TEXT_LIGHT;
};

export const PALETTE: Record<PaletteColor, PaletteEntry> = {
  'red-light': { background: '#df767f', text: TEXT_DARK },
  'red-medium-light': { background: '#d3434f', text: TEXT_DARK },
  'red-medium-dark': { background: '#d13c48', text: TEXT_LIGHT },
  'red-dark': { background: '#a72732', text: TEXT_LIGHT },

  'orange-light': { background: '#db7e40', text: TEXT_DARK },
  'orange-medium-light': { background: '#ba6023', text: TEXT_DARK },
  'orange-medium-dark': { background: '#b15b22', text: TEXT_LIGHT },
  'orange-dark': { background: '#8a471a', text: TEXT_LIGHT },

  'amber-light': { background: '#b98f2b', text: TEXT_DARK },
  'amber-medium-light': { background: '#977423', text: TEXT_DARK },
  'amber-medium-dark': { background: '#8d6d21', text: TEXT_LIGHT },
  'amber-dark': { background: '#6f551a', text: TEXT_LIGHT },

  'green-light': { background: '#40a86b', text: TEXT_DARK },
  'green-medium-light': { background: '#348857', text: TEXT_DARK },
  'green-medium-dark': { background: '#318052', text: TEXT_LIGHT },
  'green-dark': { background: '#266440', text: TEXT_LIGHT },

  'teal-light': { background: '#3ea59c', text: TEXT_DARK },
  'teal-medium-light': { background: '#33867f', text: TEXT_DARK },
  'teal-medium-dark': { background: '#2f7d76', text: TEXT_LIGHT },
  'teal-dark': { background: '#25625d', text: TEXT_LIGHT },

  'blue-light': { background: '#6b97d4', text: TEXT_DARK },
  'blue-medium-light': { background: '#4079c8', text: TEXT_DARK },
  'blue-medium-dark': { background: '#3973c4', text: TEXT_LIGHT },
  'blue-dark': { background: '#2c5999', text: TEXT_LIGHT },

  'purple-light': { background: '#a687d1', text: TEXT_DARK },
  'purple-medium-light': { background: '#8d65c5', text: TEXT_DARK },
  'purple-medium-dark': { background: '#875dc1', text: TEXT_LIGHT },
  'purple-dark': { background: '#6d41ab', text: TEXT_LIGHT },

  'pink-light': { background: '#d776a7', text: TEXT_DARK },
  'pink-medium-light': { background: '#c94688', text: TEXT_DARK },
  'pink-medium-dark': { background: '#c73f83', text: TEXT_LIGHT },
  'pink-dark': { background: '#9d2d65', text: TEXT_LIGHT },
};
