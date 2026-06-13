import type { NavigationState, BaseRoutes, HistoryEntry } from "./types";

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

  const navigate = <T extends keyof R>(
    screen: T,
    params?: R[T],
    isExternal = false,
  ) => {
    const entry: HistoryEntry<R> = {
      screen: state.currentScreen,
      params: state.params as R[typeof state.currentScreen],
    } as HistoryEntry<R>;

    state = {
      history: [...state.history, entry],
      currentScreen: screen,
      params: (params ?? {}) as Record<string, unknown>,
    };

    if (!isExternal && typeof window !== "undefined") {
      window.history.pushState({ screen, params }, "");
    }

    listeners.forEach((l) => l());
  };

  const goBack = (isExternal = false) => {
    if (state.history.length === 0) return;
    const newHistory = [...state.history];
    const entry = newHistory.pop()!;

    state = {
      currentScreen: entry.screen,
      history: newHistory,
      params: entry.params as Record<string, unknown>,
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
        navigate(event.state.screen, event.state.params as any, true);
      } else {
        goBack(true);
      }
    });
  }

  return { subscribe, getSnapshot, navigate, goBack };
}
