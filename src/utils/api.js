export const DEFAULT_PREDICT_TIMEOUT_MS = 60000;
export const DEFAULT_HEALTH_TIMEOUT_MS = 15000;

/**
 * Normalizes an API URL by trimming whitespace, removing trailing slashes,
 * and ensuring an explicit protocol is present (defaults to https://).
 * Also upgrades insecure remote http:// URLs to https:// to prevent mixed-content blocks.
 */
export function normalizeApiUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  if (!cleaned) return '';

  // If no scheme is provided, prepend https://
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  // If http:// is used for a remote host (non-localhost), upgrade to https://
  if (/^http:\/\//i.test(cleaned) && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(cleaned)) {
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  }

  return cleaned;
}

/**
 * Parses and validates the backend prediction API response.
 * Handles HTTP error status codes, placeholder responses, and validates
 * the prediction label and confidence value.
 */
export async function parsePredictionResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Server returned error status ${response.status}`);
    }
    throw new Error('Invalid JSON response from prediction server');
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.detail || data?.message || `Server responded with status: ${response.status}`;
    throw new Error(errorMsg);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.prediction || data.prediction === 'Prediction model is not connected yet') {
    throw new Error('Prediction model is not connected yet. Please check the backend.');
  }

  const validClasses = ['NORMAL', 'PNEUMONIA'];
  if (!validClasses.includes(data.prediction)) {
    throw new Error(`Unexpected prediction class: ${data.prediction}`);
  }

  const confidence = Number(data.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 100) {
    throw new Error(`Invalid confidence value returned: ${data.confidence}`);
  }

  return {
    prediction: data.prediction,
    confidence: confidence,
    model: data.model || 'Global Round-20 ResNet18',
  };
}

/**
 * Sends an X-ray image to the backend /predict endpoint with a timeout to handle
 * Render cold starts and avoid hanging requests.
 *
 * @param {string} apiUrl - The base API URL.
 * @param {File|Blob} file - The chest X-ray image file.
 * @param {object} [options] - Optional settings (e.g., timeoutMs).
 */
export async function predictImage(apiUrl, file, options = {}) {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error('API URL is not configured. Please set VITE_API_URL or use Configure URL.');
  }

  if (!file) {
    throw new Error('No image file selected. Please select a valid X-ray image.');
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_PREDICT_TIMEOUT_MS;
  const controller = new AbortController();
  const timerId = setTimeout(() => {
    controller.abort(
      new Error(`Prediction request timed out after ${Math.round(timeoutMs / 1000)} seconds. If the backend is waking up from idle mode (cold start), please wait 15 seconds and try again.`)
    );
  }, timeoutMs);

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${baseUrl}/predict`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
      signal: controller.signal,
    });

    return await parsePredictionResponse(response);
  } catch (err) {
    if (controller.signal.aborted) {
      const abortReason = controller.signal.reason;
      if (abortReason instanceof Error) {
        throw abortReason;
      }
      throw new Error(`Prediction request timed out after ${Math.round(timeoutMs / 1000)} seconds. If the backend is waking up from idle mode (cold start), please wait 15 seconds and try again.`);
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * Checks the health status of the backend API with an explicit timeout.
 *
 * @param {string} apiUrl - The base API URL.
 * @param {object} [options] - Optional settings (e.g., timeoutMs).
 */
export async function checkHealth(apiUrl, options = {}) {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error('API URL is not configured.');
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_HEALTH_TIMEOUT_MS;
  const controller = new AbortController();
  const timerId = setTimeout(() => {
    controller.abort(new Error(`Health check timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
  }, timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (controller.signal.aborted) {
      const abortReason = controller.signal.reason;
      if (abortReason instanceof Error) {
        throw abortReason;
      }
      throw new Error(`Health check timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}
