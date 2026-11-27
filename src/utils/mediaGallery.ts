import { Capacitor, registerPlugin } from '@capacitor/core';

interface MediaGalleryPlugin {
  saveToGallery(options: {
    base64: string;
    filename: string;
  }): Promise<{ saved: boolean; uri?: string }>;
}

const MediaGallery = registerPlugin<MediaGalleryPlugin>('MediaGallery');

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function savePngToGalleryOrDevice(
  dataUrl: string,
  filename: string,
): Promise<{ savedNatively: boolean; uri?: string; blob: Blob }> {
  const blob = dataUrlToBlob(dataUrl);

  if (Capacitor.isNativePlatform()) {
    const res = await MediaGallery.saveToGallery({
      base64: dataUrl,
      filename,
    });
    return { savedNatively: true, uri: res.uri, blob };
  }

  return { savedNatively: false, blob };
}
