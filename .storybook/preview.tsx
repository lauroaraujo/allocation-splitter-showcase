import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'error'
    },

    options: {
      // @ts-ignore -- https://github.com/storybookjs/storybook/issues/30429
      storySort: (a, b) => a.title.localeCompare(b.title),
    }
  },
};

export default preview;