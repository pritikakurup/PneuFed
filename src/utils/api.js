/**
 * Normalizes an API URL by trimming whitespace and removing trailing slashes.
 */
export function normalizeApiUrl(url) {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
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
 * Sends an X-ray image to the backend /predict endpoint.
 */
export async function predictImage(apiUrl, file) {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error('API URL is not configured. Please check your environment variables.');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${baseUrl}/predict`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  return parsePredictionResponse(response);
}

/**
 * Checks the health status of the backend API.
 */
export async function checkHealth(apiUrl) {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error('API URL is not configured.');
  }

  const response = await fetch(`${baseUrl}/health`, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }

  return response.json();
}
