import type { NavigationState, BaseRoutes } from "./types";

export function createRouterStore<R extends BaseRoutes>(
  initialScreen: keyof R,
) {
  let state: NavigationState<R> = {
    currentScreen: initialScreen,
    params: {},
    history: [],
  };

  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = () => state;

  const navigate = (screen: any, params?: any, isExternal = false) => {
    state = {
      history: [...state.history, state.currentScreen],
      currentScreen: screen,
      params: params ?? {},
    };

    if (!isExternal && typeof window !== "undefined") {
      window.history.pushState({ screen, params }, "");
    }

    listeners.forEach((l) => l());
  };

  const goBack = (isExternal = false) => {
    if (state.history.length === 0) return;
    const newHistory = [...state.history];
    const previous = newHistory.pop()!;

    state = {
      currentScreen: previous,
      history: newHistory,
      params: {},
    };

    if (!isExternal && typeof window !== "undefined") {
      window.history.back();
    }

    listeners.forEach((l) => l());
  };

  if (typeof window !== "undefined") {
    if (!window.history.state) {
      window.history.replaceState({ screen: initialScreen, params: {} }, "");
    }

    window.addEventListener("popstate", (event) => {
      if (event.state && event.state.screen) {
        navigate(event.state.screen, event.state.params, true);
      } else {
        goBack(true);
      }
    });
  }

  return { subscribe, getSnapshot, navigate, goBack };
}
