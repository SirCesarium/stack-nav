<div align="center">

# stack-nav

[![CI](https://github.com/SirCesarium/stack-nav/actions/workflows/ci.yml/badge.svg)](https://github.com/SirCesarium/stack-nav/actions)
[![npm version](https://img.shields.io/npm/v/stack-nav.svg)](https://www.npmjs.com/package/stack-nav)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/SirCesarium/stack-nav/blob/main/LICENSE)

State-based navigation for React apps that don't need URLs.

</div>

## What it is

stack-nav is a navigation library for React apps that don't use URLs. It has no runtime dependencies and manages the active screen, that screen's params, and the screens the user visited.

## When to use it

stack-nav is not a URL router. It covers apps where a URL router adds work without adding anything:

- Tauri and Electron windows, where there is no address bar and other router libraries are bloated/overkill.
- Small tools with a handful of screens: a wizard, a settings flow, an import dialog.
- Prototypes that would otherwise hold the current screen in `useState` and render it with a switch.

If the app needs links users can share or type, use a URL router. stack-nav keeps the stack in memory and mirrors it into `window.history.state`; screens never get a path.

## Install

```bash
bun add stack-nav
# or
npm install stack-nav
```

React 18 or 19 is the only peer dependency. The ESM build is `1.2 kB` gzipped.

## Quick start

### 1. Define the routes

```typescript
import { createStackRouter } from "stack-nav";

type Routes = {
  home: undefined;
  profile: { id: number };
};

export const useNav = createStackRouter<Routes>("home");
```

`Routes` maps each screen name to its params. Use `undefined` for screens without params. An `interface Routes` works too.

### 2. Render the current screen

```tsx
import { RouterView } from "stack-nav";
import { useNav } from "./nav";

const Home = () => {
  const { navigate } = useNav();

  return (
    <button onClick={() => navigate("profile", { id: 1 })}>Open profile</button>
  );
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

`RouterView` mounts the matching screen as a component, so each screen keeps its own hooks and state. Unknown screen names render `fallback`.

## Navigation model

- `navigate` pushes the current screen and moves to the next one.
- `reset` clears the stack and starts again at the given screen. It replaces the current browser entry, so back cannot return to the previous stack.
- `goBack` uses the browser's back button. At the first screen it calls `onRootBack` when provided, which lets a desktop shell close its window.
- Browser back and forward move through the stack, params included. They do not push new entries.
- Entries written by other code are ignored and reclaimed, so a foreign `history.state` cannot change the router.
- Reloading the page restores the stack from `history.state`.
- On the server, the router renders the initial screen. Hydration then syncs to the stored stack.

## API

### `createStackRouter<Routes>(initialScreen, options?)`

Builds the store and returns the `useNav` hook. Call it once, at module level.

`options`:

| Option | What it does |
| --- | --- |
| `onRootBack` | Called by `goBack` when the stack is already at its first screen. Default: delegate to the browser. |

### `useNav(screen?)`

Returns:

| Member | What it does |
| --- | --- |
| `currentScreen` | Active screen, typed as `keyof Routes`. |
| `params` | Params of the screen passed to `useNav`. Pass the screen name to get a precise type. |
| `history` | Screens visited before the current one, newest last. Readonly. |
| `navigate(screen, params?)` | Pushes the current screen and moves to `screen`. `params` is required when the screen declares them. |
| `reset(screen, params?)` | Clears the stack and starts over at `screen`. |
| `goBack()` | Moves back one screen, or calls `onRootBack` at the first screen. |

The screen argument only selects the type of `params`. It does not change the current screen or read the current screen's params.

### `<RouterView>`

| Prop | What it does |
| --- | --- |
| `currentScreen` | Screen to render. |
| `screens` | Map of screen name to component. |
| `fallback` | Rendered when `currentScreen` is not in `screens`. Defaults to `null`. |

## Auth and redirects

Use `reset` when the next screen should not lead back into the previous flow:

```tsx
const { reset } = useNav();

const signOut = () => {
  reset("home");
};
```

After sign-out, browser back does not reopen the authenticated screens.

## Upgrading from 1.x

- `resetNavigate` is now `reset`. It clears the stack and also replaces the current browser entry.
- `goBack` follows browser history. At the first screen it leaves the page unless `onRootBack` is set.
- `RouterView` mounts screens as components. The old `() => <Screen />` form creates a new component on every render and remounts the screen.
- `Routes` accepts `interface` declarations.

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
