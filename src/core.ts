import type {
  BaseRoutes,
  HistoryEntry,
  NavigateArgs,
  NavigationState,
  RouterOptions,
} from "./types";

const SNAPSHOT_VERSION = 2;

const MAX_SKIPS = 32;

interface StackEntry<R extends BaseRoutes> {
  id: number;
  seq: number;
  epoch: number;
  screen: keyof R;
  params: Record<string, unknown>;
}

interface Snapshot<R extends BaseRoutes> {
  stackNav: number;
  entries: StackEntry<R>[];
  index: number;
}

interface EntryBounds {
  id: number;
  seq: number;
  epoch: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStackEntry<R extends BaseRoutes>(
  value: unknown,
): value is StackEntry<R> {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "number" &&
    typeof value.seq === "number" &&
    typeof value.epoch === "number" &&
    (typeof value.screen === "string" || typeof value.screen === "number") &&
    isRecord(value.params)
  );
}

function readSnapshot<R extends BaseRoutes>(
  value: unknown,
): Snapshot<R> | null {
  if (!isRecord(value) || value.stackNav !== SNAPSHOT_VERSION) return null;

  const rawEntries = value.entries;
  const index = value.index;

  if (!Array.isArray(rawEntries) || typeof index !== "number") return null;
  if (index < 0 || index >= rawEntries.length) return null;

  const entries: StackEntry<R>[] = [];

  for (const rawEntry of rawEntries) {
    if (!isStackEntry<R>(rawEntry)) return null;

    entries.push(rawEntry);
  }

  return { stackNav: SNAPSHOT_VERSION, entries, index };
}

function readBounds<R extends BaseRoutes>(value: unknown): EntryBounds | null {
  const snapshot = readSnapshot<R>(value);
  if (!snapshot) return null;

  const entry = snapshot.entries[snapshot.index];

  return { id: entry.id, seq: entry.seq, epoch: entry.epoch };
}

export function createRouterStore<R extends BaseRoutes>(
  initialScreen: keyof R,
  options: RouterOptions = {},
) {
  const listeners = new Set<() => void>();

  const restored =
    typeof window === "undefined"
      ? null
      : readSnapshot<R>(window.history.state);

  let entries: StackEntry<R>[] = restored
    ? restored.entries
    : [{ id: 1, seq: 0, epoch: 0, screen: initialScreen, params: {} }];

  let index = restored ? restored.index : 0;

  let nextId = entries.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
  let nextSeq = entries.reduce((max, entry) => Math.max(max, entry.seq), 0) + 1;
  let epoch = entries[index].epoch;
  let skipped = 0;

  const toHistoryEntry = (entry: StackEntry<R>): HistoryEntry<R> =>
    ({
      screen: entry.screen,
      params: entry.params,
    }) as HistoryEntry<R>;

  const build = (): NavigationState<R> => {
    const current = entries[index];

    return {
      currentScreen: current.screen,
      params: current.params,
      history: entries.slice(0, index).map(toHistoryEntry),
    };
  };

  let state = build();

  const serverRenderedState: NavigationState<R> = {
    currentScreen: initialScreen,
    params: {},
    history: [],
  };

  const writeSnapshot = (mode: "push" | "replace") => {
    if (typeof window === "undefined") return;

    const snapshot: Snapshot<R> = {
      stackNav: SNAPSHOT_VERSION,
      entries,
      index,
    };

    if (mode === "push") {
      window.history.pushState(snapshot, "");
      return;
    }

    window.history.replaceState(snapshot, "");
  };

  if (!restored) {
    writeSnapshot("replace");
  }

  const getSnapshot = () => state;

  const getServerSnapshot = () => serverRenderedState;

  const notify = () => {
    state = build();
    listeners.forEach((listener) => listener());
  };

  const navigate = <T extends keyof R>(...args: NavigateArgs<R, T>) => {
    const [screen, params] = args;

    const entry: StackEntry<R> = {
      id: nextId,
      seq: nextSeq,
      epoch,
      screen,
      params: (params ?? {}) as Record<string, unknown>,
    };

    nextId += 1;
    nextSeq += 1;

    entries = [...entries.slice(0, index + 1), entry];
    index = entries.length - 1;
    skipped = 0;

    writeSnapshot("push");
    notify();
  };

  const reset = <T extends keyof R>(...args: NavigateArgs<R, T>) => {
    const [screen, params] = args;
    const position = entries[index];

    epoch += 1;

    const entry: StackEntry<R> = {
      id: nextId,
      seq: position.seq,
      epoch,
      screen,
      params: (params ?? {}) as Record<string, unknown>,
    };

    nextId += 1;
    nextSeq = position.seq + 1;
    entries = [entry];
    index = 0;
    skipped = 0;

    writeSnapshot("replace");
    notify();
  };

  const goBack = () => {
    if (typeof window === "undefined") return;

    if (index === 0 && options.onRootBack) {
      options.onRootBack();
      return;
    }

    window.history.back();
  };

  const skip = (destination: EntryBounds) => {
    if (typeof window === "undefined") return;

    const current = entries[index];

    if (destination.seq === current.seq || skipped >= MAX_SKIPS) {
      skipped = 0;
      writeSnapshot("replace");
      return;
    }

    const stepBackToCurrent = destination.seq < current.seq ? 1 : -1;

    skipped += 1;
    window.history.go(stepBackToCurrent);
  };

  const handlePopState = (event: PopStateEvent) => {
    const destination = readBounds<R>(event.state);

    if (!destination) {
      writeSnapshot("replace");
      return;
    }

    if (destination.epoch !== epoch) {
      skip(destination);
      return;
    }

    const targetIndex = entries.findIndex(
      (entry) => entry.id === destination.id,
    );

    if (targetIndex === -1) {
      writeSnapshot("replace");
      return;
    }

    index = targetIndex;
    skipped = 0;

    writeSnapshot("replace");
    notify();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);

    if (listeners.size === 1 && typeof window !== "undefined") {
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      listeners.delete(listener);

      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("popstate", handlePopState);
      }
    };
  };

  return { subscribe, getSnapshot, getServerSnapshot, navigate, reset, goBack };
}
