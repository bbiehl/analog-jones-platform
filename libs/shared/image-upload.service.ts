import { inject, Injectable } from '@angular/core';
import { STORAGE, STORAGE_OPS } from './firebase.token';

const MAX_SIZE_BYTES = 1_000_000; // 1 MB

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private storage = inject(STORAGE);
  private ops = inject(STORAGE_OPS);

  async uploadPoster(episodeId: string, file: File): Promise<string> {
    const compressed = await this.compressImage(file);
    const storageRef = this.ops.ref(this.storage, `poster/${episodeId}`);
    await this.ops.uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
    return this.ops.getDownloadURL(storageRef);
  }

  async deletePoster(episodeId: string): Promise<void> {
    const storageRef = this.ops.ref(this.storage, `poster/${episodeId}`);
    try {
      await this.ops.deleteObject(storageRef);
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'storage/object-not-found') {
        return;
      }
      throw e;
    }
  }

  private async compressImage(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const width = bitmap.width;
    const height = bitmap.height;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    let quality = 0.9;
    let blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });

    while (blob.size > MAX_SIZE_BYTES && quality > 0.1) {
      quality -= 0.1;
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    }

    if (blob.size > MAX_SIZE_BYTES) {
      const scale = Math.sqrt(MAX_SIZE_BYTES / blob.size);
      const scaledCanvas = new OffscreenCanvas(
        Math.round(width * scale),
        Math.round(height * scale)
      );
      const scaledCtx = scaledCanvas.getContext('2d')!;
      scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      blob = await scaledCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    }

    return blob;
  }
}
