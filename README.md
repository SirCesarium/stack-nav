# Stack-Nav

[![CI](https://github.com/SirCesarium/stack-nav/actions/workflows/ci.yml/badge.svg)](https://github.com/SirCesarium/stack-nav/actions)
[![npm version](https://img.shields.io/npm/v/stack-nav.svg)](https://www.npmjs.com/package/stack-nav)
[![bundle size](https://img.shields.io/bundlephobia/minzip/stack-nav)](https://bundlephobia.com/package/stack-nav)
[![license](https://img.shields.io/npm/l/stack-nav.svg)](https://github.com/SirCesarium/stack-nav/blob/main/LICENSE)

Ultra-lightweight (<1KB), headless state-based router for React with strict TypeScript support.

## Why Stack-Nav

Traditional routers (like React Router or TanStack Router) are overkill for desktop apps or simple web tools. **Stack-Nav** was built for:

- 🖥️ **Desktop Apps**: Perfect for **Tauri** or **Electron** where URL parsing is unnecessary.
- 📦 **Zero Bloat**: No dependencies. Just React `useSyncExternalStore`.
- 🛡️ **Strict Types**: Full autocompletion and compile-time safety for routes and parameters. If you skip a required parameter, TypeScript will let you know immediately.
- 🔙 **Native History**: Full support for browser back/forward buttons.

---

## Quick Start

### 1. Define Routes & Hook
```typescript
import { createStackRouter } from "stack-nav";

type Routes = {
  home: undefined;
  profile: { id: number };
};

export const useNav = createStackRouter<Routes>("home");
```

### 2. Implementation

```typescript
import { RouterView } from "stack-nav";
import { useNav } from "./nav";

const App = () => {
  const { currentScreen, navigate } = useNav();

  return (
    <RouterView<Routes>
      currentScreen={currentScreen}
      screens={{
        home: () => <button onClick={() => navigate("profile", { id: 1 })}>Go</button>,
        profile: () => <h1>Profile View</h1>
      }}
      fallback={<div>404</div>}
    />
  );
};
```

## API

- `useNav()`: Returns `{ currentScreen, routeParams, navigate, goBack, history }`.

- `<RouterView />`: Helper to render the active screen mapping.

## Installation

```
bun add stack-nav
# or
npm install stack-nav
```
