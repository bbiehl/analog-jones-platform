/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { STORAGE, STORAGE_OPS } from './firebase.token';
import { ImageUploadService } from './image-upload.service';
import type { FirebaseStorage } from 'firebase/storage';

function createMockStorageOps() {
  return {
    ref: vi.fn((_storage: unknown, path: string) => ({ fullPath: path })),
    uploadBytes: vi.fn(() => Promise.resolve()),
    getDownloadURL: vi.fn(() => Promise.resolve('https://storage.example.com/poster/ep1')),
    deleteObject: vi.fn(() => Promise.resolve()),
  };
}

function createFakeFile(size = 500): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], 'poster.jpg', { type: 'image/jpeg' });
}

function setupCanvasMocks(blobSize = 100_000) {
  const fakeBlob = new Blob(['x'.repeat(blobSize)], { type: 'image/jpeg' });
  const mockCtx = { drawImage: vi.fn() };
  const convertToBlob = vi.fn(() => Promise.resolve(fakeBlob));
  const constructorCalls: [number, number][] = [];

  class MockOffscreenCanvas {
    width: number;
    height: number;
    getContext = vi.fn(() => mockCtx);
    convertToBlob = convertToBlob;
    constructor(w: number, h: number) {
      this.width = w;
      this.height = h;
      constructorCalls.push([w, h]);
    }
  }

  vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas);
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(() => Promise.resolve({ width: 800, height: 600, close: vi.fn() }))
  );

  return { convertToBlob, mockCtx, fakeBlob, constructorCalls };
}

describe('ImageUploadService', () => {
  let service: ImageUploadService;
  let mockOps: ReturnType<typeof createMockStorageOps>;

  beforeEach(() => {
    mockOps = createMockStorageOps();

    TestBed.configureTestingModule({
      providers: [
        ImageUploadService,
        { provide: STORAGE, useValue: {} as FirebaseStorage },
        { provide: STORAGE_OPS, useValue: mockOps },
      ],
    });

    service = TestBed.inject(ImageUploadService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of ImageUploadService', () => {
      expect(service).toBeInstanceOf(ImageUploadService);
    });
  });

  describe('uploadPoster', () => {
    it('should compress the image and return a download URL', async () => {
      setupCanvasMocks();
      const file = createFakeFile();

      const url = await service.uploadPoster('ep1', file);

      expect(url).toBe('https://storage.example.com/poster/ep1');
    });

    it('should create a storage ref with the correct path', async () => {
      setupCanvasMocks();
      const file = createFakeFile();

      await service.uploadPoster('ep1', file);

      expect(mockOps.ref).toHaveBeenCalledWith(expect.anything(), 'poster/ep1');
    });

    it('should upload with image/webp content type', async () => {
      setupCanvasMocks();
      const file = createFakeFile();

      await service.uploadPoster('ep1', file);

      expect(mockOps.uploadBytes).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Blob),
        { contentType: 'image/webp' }
      );
    });
  });

  describe('deletePoster', () => {
    it('should delete the object at the correct storage path', async () => {
      await service.deletePoster('ep1');

      expect(mockOps.ref).toHaveBeenCalledWith(expect.anything(), 'poster/ep1');
      expect(mockOps.deleteObject).toHaveBeenCalled();
    });

    it('should silently handle storage/object-not-found errors', async () => {
      mockOps.deleteObject.mockRejectedValueOnce({ code: 'storage/object-not-found' });

      await expect(service.deletePoster('ep1')).resolves.toBeUndefined();
    });

    it('should rethrow non-not-found errors', async () => {
      const error = new Error('permission-denied');
      mockOps.deleteObject.mockRejectedValueOnce(error);

      await expect(service.deletePoster('ep1')).rejects.toThrow('permission-denied');
    });
  });

  describe('compressImage (via uploadPoster)', () => {
    it('should create an OffscreenCanvas with the bitmap dimensions', async () => {
      const { constructorCalls } = setupCanvasMocks();
      const file = createFakeFile();

      await service.uploadPoster('ep1', file);

      expect(constructorCalls[0]).toEqual([800, 600]);
    });

    it('should close the bitmap after drawing', async () => {
      setupCanvasMocks();
      const closeFn = vi.fn();
      vi.mocked(createImageBitmap).mockResolvedValueOnce({
        width: 800,
        height: 600,
        close: closeFn,
      } as unknown as ImageBitmap);
      const file = createFakeFile();

      await service.uploadPoster('ep1', file);

      expect(closeFn).toHaveBeenCalled();
    });

    it('should reduce quality when blob exceeds 1 MB', async () => {
      const { convertToBlob } = setupCanvasMocks();
      const largeBlob = new Blob(['x'.repeat(1_500_000)], { type: 'image/jpeg' });
      const smallBlob = new Blob(['x'.repeat(500_000)], { type: 'image/jpeg' });

      convertToBlob
        .mockResolvedValueOnce(largeBlob) // quality 0.9
        .mockResolvedValueOnce(smallBlob); // quality 0.8

      const file = createFakeFile();
      await service.uploadPoster('ep1', file);

      expect(convertToBlob).toHaveBeenCalledTimes(2);
    });

    it('should scale down the image when quality reduction is not enough', async () => {
      const { convertToBlob, constructorCalls } = setupCanvasMocks();
      const largeBlob = new Blob(['x'.repeat(1_500_000)], { type: 'image/jpeg' });

      // All quality steps still produce oversized blobs (0.9 down to 0.1 = 9 calls)
      convertToBlob.mockResolvedValue(largeBlob);

      const file = createFakeFile();
      await service.uploadPoster('ep1', file);

      // OffscreenCanvas is called once for initial + once for scaled
      expect(constructorCalls).toHaveLength(2);
      // Second call should have smaller dimensions
      expect(constructorCalls[1][0]).toBeLessThan(800);
      expect(constructorCalls[1][1]).toBeLessThan(600);
    });
  });
});
