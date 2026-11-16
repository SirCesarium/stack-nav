import type { ComponentType, ReactNode } from "react";
import type { BaseRoutes } from "./types";

type ScreenProps = Record<never, never>;

export interface RouterViewProps<R extends BaseRoutes> {
  currentScreen: keyof R;
  screens: {
    [K in keyof R]: ComponentType<ScreenProps>;
  };
  fallback?: ReactNode;
}

/**
 * Renders the component registered for `currentScreen`, or `fallback` when the
 * screen is missing.
 *
 * Screens are always mounted as components, so each one owns its hooks and
 * state. `fallback` covers unknown screens, including keys inherited from
 * `Object.prototype`.
 */
export function RouterView<R extends BaseRoutes>({
  currentScreen,
  screens,
  fallback = null,
}: RouterViewProps<R>) {
  const Screen: ComponentType<ScreenProps> | undefined = Object.hasOwn(
    screens,
    currentScreen,
  )
    ? screens[currentScreen]
    : undefined;

  if (!Screen) return <>{fallback}</>;

  return <Screen />;
}
