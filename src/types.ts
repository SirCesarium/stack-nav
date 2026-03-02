export type BaseRoutes = Record<string, any>;

export type NavigateArgs<R extends BaseRoutes, T extends keyof R> = 
  R[T] extends undefined | null | void
    ? [screen: T] 
    : [screen: T, params: R[T]];

export interface NavigationState<R extends BaseRoutes> {
  currentScreen: keyof R;
  params: any;
  history: (keyof R)[];
}

export interface RouterActions<R extends BaseRoutes> {
  navigate: <T extends keyof R>(...args: NavigateArgs<R, T>) => void;
  goBack: () => void;
}