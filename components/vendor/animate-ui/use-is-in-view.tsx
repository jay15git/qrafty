import * as React from 'react';
import type { UseInViewOptions } from 'motion/react';

interface UseIsInViewOptions {
  inView?: boolean;
  inViewOnce?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
}

function useIsInView<T extends HTMLElement = HTMLElement>(
  ref: React.Ref<T>,
  options: UseIsInViewOptions = {},
) {
  const { inView, inViewOnce = false, inViewMargin = '0px' } = options;
  const localRef = React.useRef<T>(null);
  const [isInView, setIsInView] = React.useState(!inView);

  React.useImperativeHandle(ref, () => localRef.current as T);

  React.useEffect(() => {
    if (!inView) {
      setIsInView(true);
      return;
    }

    const node = localRef.current;

    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setIsInView(visible);

        if (visible && inViewOnce) observer.disconnect();
      },
      { rootMargin: inViewMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [inView, inViewMargin, inViewOnce]);

  return { ref: localRef, isInView };
}

export { useIsInView, type UseIsInViewOptions };
