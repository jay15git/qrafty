export function isBlobUrl(value: string) {
  return value.startsWith("blob:");
}

export function isDataUrl(value: string) {
  return value.startsWith("data:");
}

export async function blobUrlToDataUrl(blobUrl: string): Promise<string | null> {
  if (typeof fetch === "undefined") {
    return null;
  }

  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
