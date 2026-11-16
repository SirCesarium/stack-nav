import { useSyncExternalStore } from "react";
import { createRouterStore } from "./core";
import type {
  BaseRoutes,
  NavigationHook,
  RouterActions,
  RouterOptions,
  ScreenParams,
} from "./types";

/**
 * Builds the store and returns the `useNav` hook.
 *
 * Create one router per `window`: every instance listens to `popstate` and
 * writes the same `history.state`, so a second router would overwrite the
 * first.
 */
export function createStackRouter<R extends BaseRoutes>(
  initialScreen: keyof R,
  options: RouterOptions = {},
): NavigationHook<R> {
  const store = createRouterStore<R>(initialScreen, options);

  const actions: RouterActions<R> = {
    navigate: store.navigate,
    replace: store.replace,
    reset: store.reset,
    goBack: store.goBack,
  };

  return function useNavigation<T extends keyof R = never>(_screen?: T) {
    const state = useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getServerSnapshot,
    );

    return {
      currentScreen: state.currentScreen,
      history: state.history,
      ...actions,
      params: state.params as ScreenParams<R, T>,
    };
  };
}
