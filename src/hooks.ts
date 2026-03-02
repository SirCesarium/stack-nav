import { useSyncExternalStore, useMemo } from "react";
import { createRouterStore } from "./core";
import type { BaseRoutes, RouterActions, NavigationState } from "./types";

export function createStackRouter<R extends BaseRoutes>(initialScreen: keyof R) {
  const store = createRouterStore<R>(initialScreen);

  return function useNavigation<T extends keyof R>(): NavigationState<R> & 
    RouterActions<R> & { routeParams: R[T] } {
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot);

    const actions = useMemo(() => ({
      navigate: (screen: any, params?: any) => store.navigate(screen, params),
      goBack: () => store.goBack(),
    }), []);

    return { 
      ...state, 
      ...actions, 
      routeParams: state.params as R[T] 
    };
  };
}
