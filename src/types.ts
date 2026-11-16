/**
 * Route map: each key is a screen name and each value is the params that
 * screen receives.
 *
 * `object` instead of `Record<string, unknown>` so `interface` declarations
 * satisfy the constraint.
 */
export type BaseRoutes = object;

/**
 * Params of `screen` as seen by `useNav`.
 *
 * A screen without params resolves to an empty object, so reading a property
 * from it is a type error.
 */
export type ScreenParams<R extends BaseRoutes, T extends keyof R> = [
  T,
] extends [never]
  ? Record<never, never>
  : [NonNullable<R[T]>] extends [never]
    ? Record<never, never>
    : NonNullable<R[T]>;

/**
 * Arguments accepted by `navigate` and `reset`.
 *
 * Screens whose params include `undefined` can be called without params; the
 * rest require them.
 */
export type NavigateArgs<
  R extends BaseRoutes,
  T extends keyof R,
> = undefined extends R[T]
  ? [screen: T, params?: R[T]]
  : [screen: T, params: R[T]];

/**
 * One screen and its params, as stored in the navigation stack.
 */
export type HistoryEntry<R extends BaseRoutes> = {
  [K in keyof R]: { screen: K; params: R[K] };
}[keyof R];

/**
 * Snapshot exposed by the navigation store.
 */
export interface NavigationState<R extends BaseRoutes> {
  currentScreen: keyof R;
  params: Record<string, unknown>;
  history: readonly HistoryEntry<R>[];
}

/**
 * Navigation actions returned by `useNav`.
 */
export interface RouterActions<R extends BaseRoutes> {
  /** Pushes the current screen and moves to `screen`. */
  navigate: <T extends keyof R>(...args: NavigateArgs<R, T>) => void;

  /** Clears the stack and starts over at `screen`. */
  reset: <T extends keyof R>(...args: NavigateArgs<R, T>) => void;

  /** Moves to the previous screen, or leaves the app at the root. */
  goBack: () => void;
}

/**
 * State and actions returned by `useNav`.
 */
export type NavigationView<R extends BaseRoutes> = {
  currentScreen: keyof R;
  history: readonly HistoryEntry<R>[];
} & RouterActions<R>;

/**
 * Hook returned by `createStackRouter`.
 *
 * The optional screen only selects the type of `params`: it does not change
 * the current screen. Pass the screen a component is rendered for so its
 * params are typed precisely.
 */
export type NavigationHook<R extends BaseRoutes> = <T extends keyof R = never>(
  screen?: T,
) => NavigationView<R> & { params: ScreenParams<R, T> };
