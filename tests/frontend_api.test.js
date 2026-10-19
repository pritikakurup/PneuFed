import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiUrl, parsePredictionResponse, predictImage, checkHealth } from '../src/utils/api.js';

test('normalizeApiUrl handles clean and trailing-slash URLs', () => {
  assert.equal(normalizeApiUrl('https://example.ngrok-free.dev'), 'https://example.ngrok-free.dev');
  assert.equal(normalizeApiUrl('https://example.ngrok-free.dev/'), 'https://example.ngrok-free.dev');
  assert.equal(normalizeApiUrl('https://example.ngrok-free.dev///'), 'https://example.ngrok-free.dev');
  assert.equal(normalizeApiUrl('  https://example.ngrok-free.dev/  '), 'https://example.ngrok-free.dev');
  assert.equal(normalizeApiUrl(''), '');
  assert.equal(normalizeApiUrl(null), '');
});

test('parsePredictionResponse succeeds on valid NORMAL prediction', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ({
      prediction: 'NORMAL',
      confidence: 99.82,
    }),
  };

  const result = await parsePredictionResponse(mockResponse);
  assert.equal(result.prediction, 'NORMAL');
  assert.equal(result.confidence, 99.82);
  assert.equal(result.model, 'Global Round-20 ResNet18');
});

test('parsePredictionResponse succeeds on valid PNEUMONIA prediction', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ({
      prediction: 'PNEUMONIA',
      confidence: 97.45,
    }),
  };

  const result = await parsePredictionResponse(mockResponse);
  assert.equal(result.prediction, 'PNEUMONIA');
  assert.equal(result.confidence, 97.45);
});

test('parsePredictionResponse rejects placeholder response', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ({
      prediction: 'Prediction model is not connected yet',
      confidence: 0,
    }),
  };

  await assert.rejects(
    async () => await parsePredictionResponse(mockResponse),
    {
      message: 'Prediction model is not connected yet. Please check the backend.',
    }
  );
});

test('parsePredictionResponse extracts backend error message on 400 status', async () => {
  const mockResponse = {
    ok: false,
    status: 400,
    json: async () => ({
      error: 'No image field in request',
    }),
  };

  await assert.rejects(
    async () => await parsePredictionResponse(mockResponse),
    {
      message: 'No image field in request',
    }
  );
});

test('parsePredictionResponse extracts backend error message on 500 status', async () => {
  const mockResponse = {
    ok: false,
    status: 500,
    json: async () => ({
      error: 'Prediction failed: corrupted image bytes',
    }),
  };

  await assert.rejects(
    async () => await parsePredictionResponse(mockResponse),
    {
      message: 'Prediction failed: corrupted image bytes',
    }
  );
});

test('parsePredictionResponse extracts FastAPI detail field on error status', async () => {
  const mockResponse = {
    ok: false,
    status: 400,
    json: async () => ({
      detail: 'Invalid image format',
    }),
  };

  await assert.rejects(
    async () => await parsePredictionResponse(mockResponse),
    {
      message: 'Invalid image format',
    }
  );
});

test('parsePredictionResponse rejects unknown prediction classes', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ({
      prediction: 'COVID19',
      confidence: 90,
    }),
  };

  await assert.rejects(
    async () => await parsePredictionResponse(mockResponse),
    /Unexpected prediction class: COVID19/
  );
});

test('parsePredictionResponse rejects invalid confidence values', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ({
      prediction: 'NORMAL',
      confidence: 'not_a_number',
    }),
  };

  await assert.rejects(
    async () => await parsePredictionResponse(mockResponse),
    /Invalid confidence value returned/
  );
});

test('normalizeApiUrl auto-prepends https:// for bare domains without protocol', () => {
  assert.equal(normalizeApiUrl('pneufed-api.onrender.com'), 'https://pneufed-api.onrender.com');
  assert.equal(normalizeApiUrl('pneufed-api.onrender.com/'), 'https://pneufed-api.onrender.com');
  assert.equal(normalizeApiUrl('http://pneufed-api.onrender.com'), 'https://pneufed-api.onrender.com');
  assert.equal(normalizeApiUrl('http://localhost:5000'), 'http://localhost:5000');
  assert.equal(normalizeApiUrl('http://127.0.0.1:8000'), 'http://127.0.0.1:8000');
});

test('predictImage rejects with clear cold-start message when request times out', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_url, options) => {
    return new Promise((_, reject) => {
      options.signal?.addEventListener('abort', () => {
        const error = new Error('The operation was aborted.');
        error.name = 'AbortError';
        reject(error);
      });
    });
  };

  try {
    const dummyBlob = new Blob(['dummy'], { type: 'image/jpeg' });
    await assert.rejects(
      async () => await predictImage('https://pneufed-api.onrender.com', dummyBlob, { timeoutMs: 50 }),
      /Prediction request timed out after 0 seconds/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('predictImage supports repeated predictions sequentially', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  globalThis.fetch = async (url) => {
    callCount++;
    const isEven = callCount % 2 === 0;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        prediction: isEven ? 'PNEUMONIA' : 'NORMAL',
        confidence: 99.5,
        model: 'Global Round-20 ResNet18',
      }),
    };
  };

  try {
    const dummyBlob = new Blob(['image data'], { type: 'image/jpeg' });
    const res1 = await predictImage('https://pneufed-api.onrender.com', dummyBlob);
    assert.equal(res1.prediction, 'NORMAL');

    const res2 = await predictImage('https://pneufed-api.onrender.com', dummyBlob);
    assert.equal(res2.prediction, 'PNEUMONIA');

    const res3 = await predictImage('https://pneufed-api.onrender.com', dummyBlob);
    assert.equal(res3.prediction, 'NORMAL');
    assert.equal(callCount, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});




