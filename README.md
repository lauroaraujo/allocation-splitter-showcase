# allocation-splitter

A React + TypeScript component library, developed and documented with Storybook.

## Scripts

- `npm run storybook` — run Storybook locally at http://localhost:6006
- `npm run build-storybook` — build the static Storybook site into `storybook-static/` (this is what gets deployed to Vercel)
- `npm run build` — typecheck and build the library into `dist/` (ESM + CJS + type declarations)
- `npm run lint` — run oxlint

## Project structure

- `src/components/` — library components, each with its component file, styles, and `.stories.ts`
- `src/index.ts` — public entry point / barrel export for the package
- `.storybook/` — Storybook configuration

## Deploying Storybook to Vercel

`vercel.json` is already configured to build and deploy the static Storybook site:

- Build command: `npm run build-storybook`
- Output directory: `storybook-static`

## Publishing the library

`package.json` is set up to publish the built library (`dist/`) to npm, with `react`/`react-dom` as peer dependencies.
