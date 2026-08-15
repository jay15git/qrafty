import * as React from "react";

function useLazyRef<T>(fn: () => T) {
  // eslint-disable-next-line react-doctor/exhaustive-deps -- initializer must run once
  const ref = React.useMemo(() => ({ current: fn() as T }), []);

  return ref as React.RefObject<T>;
}

export { useLazyRef };
