# Template App

A minimal **React + TypeScript + Vite** starter template that provides a clean foundation for building new apps. It ships with a small set of reusable UI components and SCSS module styling out of the box.

---

## Overview

This template demonstrates a simple, well-structured frontend-only app. It includes two foundational components (`Button` and `Header`), a basic counter interaction, and a CSS-modules-based styling approach using SCSS. Use it as a starting point whenever you need to spin up a new app quickly.

---

## Project Structure

```
template/
├── index.html                        # App entry point / HTML shell
└── frontend/
    ├── main.tsx                      # React root mount
    ├── App.tsx                       # Root application component
    ├── App.css                       # App-level styles
    ├── index.scss                    # Global SCSS reset / base styles
    ├── vite-env.d.ts                 # Vite type declarations
    ├── tsconfig.json                 # TypeScript compiler config
    ├── assets/
    │   └── react.svg                 # React logo asset
    └── components/
        ├── button/
        │   ├── button.tsx            # Button component
        │   └── button.module.scss    # Button scoped styles
        └── header/
            ├── header.tsx            # Header component
            └── header.module.scss    # Header scoped styles
```

---

## Components

### `Button`

A flexible, accessible button component that wraps the native HTML `<button>` element.

**Props:**

| Prop        | Type                                  | Default     | Description                                 |
|-------------|---------------------------------------|-------------|---------------------------------------------|
| `variant`   | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Visual style of the button                  |
| `size`      | `'sm' \| 'md' \| 'lg'`               | `'md'`      | Size of the button                          |
| `children`  | `React.ReactNode`                     | —           | Button label / content                      |
| `...rest`   | `React.ButtonHTMLAttributes`          | —           | All standard HTML button attributes (e.g. `onClick`, `disabled`) |

**Usage:**

```tsx
import Button from './components/button/button';

<Button variant="primary" size="lg" onClick={() => console.log('clicked')}>
  Click me
</Button>

<Button variant="secondary">Cancel</Button>

<Button variant="danger" disabled>Delete</Button>
```

**Variants:**
- `primary` — Filled purple/indigo background, white text
- `secondary` — Transparent with a purple border and text
- `danger` — Red background, white text

**Sizes:**
- `sm` — Compact (0.85rem font, reduced padding)
- `md` — Default (1rem font)
- `lg` — Large (1.15rem font, generous padding)

---

### `Header`

A semantic heading component that renders the correct `<h1>`–`<h6>` HTML tag based on the `level` prop, with consistent typographic sizing via SCSS modules.

**Props:**

| Prop        | Type                        | Default | Description                          |
|-------------|-----------------------------|---------|--------------------------------------|
| `level`     | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | —       | Heading level (required)             |
| `children`  | `React.ReactNode`           | —       | Heading content                      |
| `className` | `string`                    | —       | Optional additional CSS class        |

**Usage:**

```tsx
import Header from './components/header/header';

<Header level={1}>Page Title</Header>
<Header level={2}>Section Heading</Header>
<Header level={3} className="custom-class">Subsection</Header>
```

**Font sizes by level:**

| Level | Font size |
|-------|-----------|
| h1    | 2rem      |
| h2    | 1.75rem   |
| h3    | 1.5rem    |
| h4    | 1.25rem   |
| h5    | 1.1rem    |
| h6    | 1rem      |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI rendering |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [SCSS Modules](https://sass-lang.com/) | Scoped component styling |

---

## Getting Started

This app is managed via the Cowork easy-apps platform. To make changes:

1. Use the file tools to read, edit, or create files within the `frontend/` directory.
2. Components live in `frontend/components/<name>/` — each with a `.tsx` and a `.module.scss` file.
3. Add new components by creating a matching folder under `frontend/components/`.
4. Update `App.tsx` to compose components into the UI.

---

## Extending This Template

When building a new app from this template, typical next steps include:

- **Rename** the app ID from `template` to something meaningful.
- **Update** `index.html` title from `"Vite + React + TS"` to your app's name.
- **Replace** the demo counter in `App.tsx` with your actual UI.
- **Add components** under `frontend/components/` following the existing pattern.
- **Add a backend** in the `backend/` directory if server-side logic is needed.
- **Expand global styles** in `frontend/index.scss` for shared design tokens (colours, fonts, spacing).
