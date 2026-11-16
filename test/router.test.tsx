import { expect, test, describe, beforeEach, afterEach, vi } from "bun:test";
import { render, screen, act, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import React from "react";
import { createStackRouter, RouterView } from "../src";

type Routes = {
  home: undefined;
  profile: { id: number };
  empty: undefined;
};

interface HistorySnapshot {
  stackNav: number;
  index: number;
  entries: {
    screen: string;
    params: Record<string, unknown>;
  }[];
}

const historySnapshot = () => window.history.state as HistorySnapshot;

describe("stack-nav", () => {
  let useNav: ReturnType<typeof createStackRouter<Routes>>;

  beforeEach(() => {
    window.history.replaceState(null, "", "");
    useNav = createStackRouter<Routes>("home");
  });

  afterEach(() => {
    cleanup();
  });

  test("initializes with the default screen", () => {
    const App = () => {
      const { currentScreen } = useNav();
      return <div>{currentScreen}</div>;
    };
    render(<App />);
    expect(screen.getByText("home")).toBeTruthy();
  });

  test("navigates to a new screen with parameters", async () => {
    const App = () => {
      const { currentScreen, params, navigate } = useNav<"profile">();
      return (
        <div>
          <span data-testid="screen">{currentScreen}</span>
          <span data-testid="params">{params.id}</span>
          <button onClick={() => navigate("profile", { id: 101 })}>Go</button>
        </div>
      );
    };

    render(<App />);
    await act(async () => {
      screen.getByText("Go").click();
    });

    expect(screen.getByTestId("screen").textContent).toBe("profile");
    expect(screen.getByTestId("params").textContent).toBe("101");
  });

  test("goBack delegates to browser history", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});

    const App = () => {
      const { goBack } = useNav();
      return <button onClick={goBack}>Back</button>;
    };

    render(<App />);

    await act(async () => {
      screen.getByRole("button").click();
    });

    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  test("goBack calls onRootBack instead of the browser at the root", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const onRootBack = vi.fn();
    const useShellNav = createStackRouter<Routes>("home", { onRootBack });

    const App = () => {
      const { goBack } = useShellNav();
      return <button onClick={goBack}>Back</button>;
    };

    render(<App />);

    await act(async () => {
      screen.getByRole("button").click();
    });

    expect(onRootBack).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();

    back.mockRestore();
  });

  test("browser back and forward move through the stack without pushing", async () => {
    const pushState = vi.spyOn(window.history, "pushState");

    const App = () => {
      const { currentScreen, history, navigate } = useNav();
      return (
        <div>
          <span data-testid="screen">{currentScreen}</span>
          <span data-testid="depth">{history.length}</span>
          <button onClick={() => navigate("profile", { id: 1 })}>
            Profile
          </button>
          <button onClick={() => navigate("empty")}>Empty</button>
        </div>
      );
    };

    render(<App />);

    await act(async () => {
      screen.getByText("Profile").click();
    });

    await act(async () => {
      screen.getByText("Empty").click();
    });

    const profileState = pushState.mock.calls[0][0];
    const emptyState = pushState.mock.calls[1][0];

    await act(async () => {
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: profileState }),
      );
    });

    expect(screen.getByTestId("screen").textContent).toBe("profile");
    expect(screen.getByTestId("depth").textContent).toBe("1");

    await act(async () => {
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: emptyState }),
      );
    });

    expect(screen.getByTestId("screen").textContent).toBe("empty");
    expect(screen.getByTestId("depth").textContent).toBe("2");

    pushState.mockRestore();
  });

  test("reset blocks back into the previous stack", async () => {
    const go = vi.spyOn(window.history, "go").mockImplementation(() => {});

    const App = () => {
      const { currentScreen, navigate, reset } = useNav();
      return (
        <div>
          <span data-testid="screen">{currentScreen}</span>
          <button onClick={() => navigate("profile", { id: 1 })}>
            Profile
          </button>
          <button onClick={() => reset("empty")}>Reset</button>
        </div>
      );
    };

    render(<App />);

    const homeState = historySnapshot();

    await act(async () => {
      screen.getByText("Profile").click();
    });

    await act(async () => {
      screen.getByText("Reset").click();
    });

    expect(screen.getByTestId("screen").textContent).toBe("empty");

    await act(async () => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: homeState }));
    });

    expect(screen.getByTestId("screen").textContent).toBe("empty");
    expect(go).toHaveBeenCalledWith(1);

    go.mockRestore();
  });

  test("ignores state that does not belong to the router", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    const App = () => {
      const { currentScreen } = useNav();
      return <div data-testid="screen">{currentScreen}</div>;
    };

    render(<App />);
    replaceState.mockClear();

    await act(async () => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: { screen: "profile", params: { id: 5 } },
        }),
      );
    });

    expect(screen.getByTestId("screen").textContent).toBe("home");
    expect(replaceState).toHaveBeenCalled();

    replaceState.mockRestore();
  });

  test("restores the stack from browser history state", async () => {
    const First = () => {
      const { navigate } = useNav();
      return <button onClick={() => navigate("profile", { id: 7 })}>Go</button>;
    };

    const first = render(<First />);

    await act(async () => {
      screen.getByText("Go").click();
    });

    first.unmount();

    const useRestored = createStackRouter<Routes>("home");
    const Restored = () => {
      const { currentScreen, history, params } = useRestored("profile");
      return (
        <div>
          <span data-testid="screen">{currentScreen}</span>
          <span data-testid="depth">{history.length}</span>
          <span data-testid="id">{params.id}</span>
        </div>
      );
    };

    render(<Restored />);

    expect(screen.getByTestId("screen").textContent).toBe("profile");
    expect(screen.getByTestId("depth").textContent).toBe("1");
    expect(screen.getByTestId("id").textContent).toBe("7");
  });

  test("ensures params is an empty object instead of null", () => {
    const App = () => {
      const { params } = useNav();
      return <div>{JSON.stringify(params)}</div>;
    };
    render(<App />);
    expect(screen.getByText("{}")).toBeTruthy();
  });

  test("RouterView renders the correct screen component", () => {
    const Home = () => <div>HomeView</div>;
    const Profile = () => <div>ProfileView</div>;

    const App = () => {
      const { currentScreen } = useNav();
      return (
        <RouterView<Routes>
          currentScreen={currentScreen}
          screens={{
            home: Home,
            profile: Profile,
            empty: () => <div>EmptyView</div>,
          }}
        />
      );
    };

    render(<App />);
    expect(screen.getByText("HomeView")).toBeTruthy();
  });

  test("RouterView renders fallback when screen is missing", () => {
    const App = () => (
      <RouterView<any>
        currentScreen="unknown"
        screens={{}}
        fallback={<div data-testid="fallback">Not Found</div>}
      />
    );

    render(<App />);
    expect(screen.getByTestId("fallback")).toBeTruthy();
  });

  test("RouterView keeps hooks isolated when switching screens", () => {
    const Home = () => {
      const [visits] = React.useState(1);
      return <div>HomeView {visits}</div>;
    };
    const Profile = () => {
      const [visits] = React.useState(1);
      const [label] = React.useState("profile");
      return (
        <div>
          ProfileView {visits} {label}
        </div>
      );
    };
    const screens = {
      home: Home,
      profile: Profile,
      empty: () => <div>EmptyView</div>,
    };

    const { rerender } = render(
      <RouterView<Routes> currentScreen="home" screens={screens} />,
    );
    expect(screen.getByText(/HomeView/)).toBeTruthy();

    rerender(<RouterView<Routes> currentScreen="profile" screens={screens} />);
    expect(screen.getByText(/ProfileView/)).toBeTruthy();
  });

  test("RouterView ignores keys inherited from Object.prototype", () => {
    for (const key of ["__proto__", "constructor", "toString"]) {
      const { unmount } = render(
        <RouterView<any>
          currentScreen={key}
          screens={{}}
          fallback={<div data-testid="fallback">Not Found</div>}
        />,
      );

      expect(screen.getByTestId("fallback")).toBeTruthy();
      unmount();
    }
  });

  test("reset clears history and navigates to new screen", async () => {
    const App = () => {
      const { currentScreen, history, navigate, reset } = useNav();
      return (
        <div>
          <span data-testid="screen">{currentScreen}</span>
          <span data-testid="history-length">{history.length}</span>
          <button onClick={() => navigate("profile", { id: 1 })}>
            Go Profile
          </button>
          <button onClick={() => reset("home")}>Reset to Home</button>
        </div>
      );
    };

    render(<App />);

    await act(async () => {
      screen.getByText("Go Profile").click();
    });

    expect(screen.getByTestId("screen").textContent).toBe("profile");
    expect(screen.getByTestId("history-length").textContent).toBe("1");

    await act(async () => {
      screen.getByText("Reset to Home").click();
    });

    expect(screen.getByTestId("screen").textContent).toBe("home");
    expect(screen.getByTestId("history-length").textContent).toBe("0");
  });

  test("reset replaces the current browser entry", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    const App = () => {
      const { reset } = useNav();
      return (
        <button onClick={() => reset("profile", { id: 42 })}>Reset</button>
      );
    };

    render(<App />);
    replaceState.mockClear();

    await act(async () => {
      screen.getByText("Reset").click();
    });

    const snapshot = historySnapshot();

    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.entries[snapshot.index].screen).toBe("profile");
    expect(snapshot.entries[snapshot.index].params).toEqual({ id: 42 });

    replaceState.mockRestore();
  });

  test("renders the initial screen on the server", () => {
    const useServerNav = createStackRouter<Routes>("home");

    const App = () => {
      const { currentScreen, history } = useServerNav();

      return (
        <div>
          <span data-testid="screen">{currentScreen}</span>
          <span data-testid="depth">{history.length}</span>
        </div>
      );
    };

    const html = renderToString(<App />);

    expect(html).toContain("home");
    expect(html).toContain(">0<");
  });
});
