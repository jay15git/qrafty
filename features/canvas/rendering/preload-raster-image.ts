const preloadCache = new Map<string, Promise<void>>();

export function preloadRasterImage(url: string): Promise<void> {
  if (!url) {
    return Promise.resolve();
  }

  const cached = preloadCache.get(url);
  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if (typeof image.decode === "function") {
        void image
          .decode()
          .then(resolve)
          .catch(() => resolve());
        return;
      }

      resolve();
    };

    image.onerror = () => {
      preloadCache.delete(url);
      reject(new Error(`Failed to preload image: ${url}`));
    };

    image.src = url;
  });

  preloadCache.set(url, promise);
  return promise;
}
