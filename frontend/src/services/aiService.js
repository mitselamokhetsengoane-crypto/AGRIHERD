import api from './api';

export const RETRY_DELAYS_MS = [3000, 8000, 15000];
const SCAN_TIMEOUT_MS = 90000;
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;
const SKIP_COMPRESSION_BELOW_BYTES = 300 * 1024;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const shouldRetry = (error) => {
  if (!error.response) return true;
  const { status, data } = error.response;
  if (status === 502 || status === 504) return true;
  if (status === 503) return typeof data?.detail !== 'string';
  return false;
};

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
    // 1. WALK UP THE AI SERVICE FIRST
    try {
        // This call can take up to 120 seconds if the AI service is asleep.
        await api.get('/ai/wake', { timeout: 120000 });
    } catch (e) {
        // Even if wake fails, we will still try to scan. 
        console.warn("Wake-up check failed, proceeding to scan anyway.");
    }

    const prepared = await prepareImage(imageFile);
    const formData = new FormData();
    formData.append('file', prepared);

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

  getScanResult: async (scanId) => {
    const response = await api.get(`/disease-scanner/scans/${encodeURIComponent(scanId)}`);
    return response.data;
  },
};

export default aiService;