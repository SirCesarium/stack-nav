<div align="center">

# stack-nav

[![CI](https://github.com/SirCesarium/stack-nav/actions/workflows/ci.yml/badge.svg)](https://github.com/SirCesarium/stack-nav/actions)
[![npm version](https://img.shields.io/npm/v/stack-nav.svg)](https://www.npmjs.com/package/stack-nav)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/SirCesarium/stack-nav/blob/main/LICENSE)

State-based navigation for React apps that don't need URLs.

</div>

## What it is

stack-nav keeps a stack of screens and their params, and connects the browser's back and forward buttons to that stack. No URL parsing, no route patterns.

> Zero deps, and the ESM build is `731 bytes` gzipped.

`createStackRouter` returns a hook with the current screen, its params, and the actions to move between screens. Params are checked at compile time: if you skip one a screen requires, the build fails instead of the runtime.

## When to use it

stack-nav is not a URL router, and it does not try to become one. It covers the cases where a URL router adds work without adding anything:

- Tauri and Electron windows, where there is no address bar to fill.
- Small tools with a handful of screens: a wizard, a settings flow, an import dialog.
- Prototypes where you would otherwise hold the current screen in `useState` and write a switch to render it.

If you need deep links, shareable URLs, bookmarking or server-side rendering, use a URL router. stack-nav keeps the history in memory and mirrors it into `window.history.state`; screens never get a path.

## Quick start

### 1. Define your routes

```typescript
import { createStackRouter } from "stack-nav";

type Routes = {
  home: undefined;
  profile: { id: number };
};

export const useNav = createStackRouter<Routes>("home");
```

`Routes` maps each screen name to the params it takes. Use `undefined` for screens that take none.

### 2. Render the current screen

```tsx
import { RouterView } from "stack-nav";
import { useNav } from "./nav";

const Home = () => {
  const { navigate } = useNav();

  return <button onClick={() => navigate("profile", { id: 1 })}>Open profile</button>;
};

const Profile = () => {
  const { params, goBack } = useNav("profile");

  return (
    <>
      <h1>Profile</h1>
      <p>User ID: {params.id}</p>
      <button onClick={goBack}>Back</button>
    </>
  );
};

export const App = () => {
  const { currentScreen } = useNav();

  return (
    <RouterView<Routes>
      currentScreen={currentScreen}
      screens={{ home: Home, profile: Profile }}
      fallback={<p>Screen not found</p>}
    />
  );
};
```

## API

`createStackRouter<Routes>(initialScreen)` builds the store once and returns `useNav`.

`useNav(screen?)` returns:

| Member | What it does |
| --- | --- |
| `currentScreen` | The active screen, typed as `keyof Routes`. |
| `params` | Params of the screen you passed to `useNav`. The name is what gives `params` its type. |
| `history` | Screens visited before the current one, newest last. |
| `navigate(screen, params)` | Pushes the current screen onto the stack and moves to `screen`. `params` is required when `screen` declares them. |
| `resetNavigate(screen, params)` | Replaces the state and clears the stack, so `goBack` has nowhere to go. |
| `goBack()` | Pops the last entry off the stack. Does nothing when the stack is empty. |

`<RouterView>` props:

| Prop | What it does |
| --- | --- |
| `currentScreen` | The screen to render. |
| `screens` | Map of screen name to a component or a function returning React nodes. |
| `fallback` | Rendered when `currentScreen` is missing from `screens`. Defaults to `null`. |

## Install

```bash
bun add stack-nav
# or
npm install stack-nav
```

React 18 or 19 is the only peer dependency.

## Development

The CI runs these on every push and pull request:

```bash
bun install --frozen-lockfile
bun run lint
bun test --dom
bun run build
```

## License

MIT. See [LICENSE](./LICENSE).
