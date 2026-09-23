import * as React from "react";

function useLazyRef<T>(fn: () => T) {
  // useState's lazy initializer runs exactly once per mount and yields a stable
  // object identity, so `ref.current` stays mutable without re-running `fn`.
  const [ref] = React.useState(() => ({ current: fn() as T }));

  return ref as React.RefObject<T>;
}

export { useLazyRef };
