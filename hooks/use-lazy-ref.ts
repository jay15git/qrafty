import * as React from "react";

function useLazyRef<T>(fn: () => T) {
  const ref = React.useMemo(() => ({ current: fn() as T }), []);

  return ref as React.RefObject<T>;
}

export { useLazyRef };
