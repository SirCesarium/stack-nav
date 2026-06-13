export type BaseRoutes = Record<string, unknown>;

export type NavigateArgs<
  R extends BaseRoutes,
  T extends keyof R,
> = R[T] extends undefined | null | void
  ? [screen: T]
  : [screen: T, params: R[T]];

export type HistoryEntry<R extends BaseRoutes> = {
  [K in keyof R]: { screen: K; params: R[K] }
}[keyof R];

export interface NavigationState<R extends BaseRoutes> {
  currentScreen: keyof R;
  params: Record<string, unknown>;
  history: HistoryEntry<R>[];
}

export interface RouterActions<R extends BaseRoutes> {
  navigate: <T extends keyof R>(...args: NavigateArgs<R, T>) => void;
  goBack: () => void;
}
export type NavigationHook<R extends BaseRoutes> = <T extends keyof R>(
  screen?: T,
) => {
  currentScreen: keyof R;
  history: HistoryEntry<R>[];
  params: R[T] | Record<string, never>;
} & RouterActions<R>;
