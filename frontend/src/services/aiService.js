import api from './api';

// Free servers can need up to a minute to wake up, so retry with growing delays instead of once after 2 seconds.
export const RETRY_DELAYS_MS = [3000, 8000, 15000];
const SCAN_TIMEOUT_MS = 90000;
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;
const SKIP_COMPRESSION_BELOW_BYTES = 300 * 1024;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry only when the SERVER was unreachable, not when it answered with a real error.
 * - no response at all (network error, sleeping server, CORS error from a proxy page)  -> retry
 * - 502 / 504 (proxy could not reach the app)                                          -> retry
 * - 503 with no JSON message (proxy page)                                               -> retry
 * - 503 with our own JSON message ("model unavailable"), 400, 413, 422, 429 ...        -> do NOT retry
 */
export const shouldRetry = (error) => {
  if (!error.response) return true;
  const { status, data } = error.response;
  if (status === 502 || status === 504) return true;
  if (status === 503) return typeof data?.detail !== 'string';
  return false;
};

/** Shrink big phone photos in the browser (faster upload, less server memory). Falls back to the original file on any problem. */
export const prepareImage = async (file) => {
  try {
    if (!file?.type?.startsWith('image/') || file.size < SKIP_COMPRESSION_BELOW_BYTES) return file;
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.\w+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
};

const aiService = {
  scanImage: async (imageFile, onRetry) => {
    const prepared = await prepareImage(imageFile);
    const formData = new FormData();
    formData.append('file', prepared);

    // No manual multipart Content-Type: the browser must add the boundary itself.
    const request = () => api.post('/disease-scanner/scan', formData, {
      headers: { 'Content-Type': undefined },
      timeout: SCAN_TIMEOUT_MS,
    });

    let lastError;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await request();
        return response.data;
      } catch (error) {
        lastError = error;
        if (attempt === RETRY_DELAYS_MS.length || !shouldRetry(error)) throw error;
        onRetry?.(attempt + 1, RETRY_DELAYS_MS.length);
        await wait(RETRY_DELAYS_MS[attempt]);
      }
    }
    throw lastError;
  },

  getScanHistory: async () => {
    const response = await api.get('/disease-scanner/history');
    return response.data;
  },
};

export default aiService;