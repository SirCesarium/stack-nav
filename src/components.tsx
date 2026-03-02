import React from "react";
import type { BaseRoutes } from "./types";

interface RouterViewProps<R extends BaseRoutes> {
  currentScreen: keyof R;
  screens: {
    [K in keyof R]: React.ComponentType<any> | (() => React.ReactNode);
  };
  fallback?: React.ReactNode;
}

export function RouterView<R extends BaseRoutes>({
  currentScreen,
  screens,
  fallback = null,
}: RouterViewProps<R>) {
  const Component = screens[currentScreen];
  if (!Component) return <>{fallback}</>;

  if (
    typeof Component === "function" &&
    !(Component.prototype instanceof React.Component)
  ) {
    const RenderFn = Component as () => React.ReactNode;
    return <>{RenderFn()}</>;
  }

  const ReactComponent = Component as React.ComponentType<any>;
  return <ReactComponent />;
}
