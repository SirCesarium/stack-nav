import { expect, test, describe, beforeEach, afterEach, vi } from "bun:test";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import { createStackRouter, RouterView } from "../src";

type Routes = {
  home: undefined;
  profile: { id: number };
  empty: undefined;
};

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

  test("handles goBack safely on empty history", async () => {
    const App = () => {
      const { currentScreen, goBack } = useNav();
      return <button onClick={goBack}>{currentScreen}</button>;
    };

    render(<App />);
    await act(async () => {
      screen.getByRole("button").click();
    });

    expect(screen.getByRole("button").textContent).toBe("home");
  });

  test("syncs state with browser back button", async () => {
    const App = () => {
      const { currentScreen, navigate } = useNav();
      return <div data-testid="screen">{currentScreen}</div>;
    };

    render(<App />);

    await act(async () => {
      const event = new PopStateEvent("popstate", {
        state: { screen: "profile", params: { id: 5 } },
      });
      window.dispatchEvent(event);
    });

    expect(screen.getByTestId("screen").textContent).toBe("profile");
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

  test("resetNavigate clears history and navigates to new screen", async () => {
    const App = () => {
      const { currentScreen, history, navigate, resetNavigate } = useNav();
      return (
        <div>
          <span data-testid="screen">{currentScreen}</span>
          <span data-testid="history-length">{history.length}</span>
          <button onClick={() => navigate("profile", { id: 1 })}>Go Profile</button>
          <button onClick={() => resetNavigate("home")}>Reset to Home</button>
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

  test("resetNavigate replaces browser history state", async () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    const App = () => {
      const { resetNavigate } = useNav();
      return <button onClick={() => resetNavigate("profile", { id: 42 })}>Reset</button>;
    };

    render(<App />);

    await act(async () => {
      screen.getByText("Reset").click();
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(
      { screen: "profile", params: { id: 42 } },
      "",
    );
    replaceStateSpy.mockRestore();
  });
});
