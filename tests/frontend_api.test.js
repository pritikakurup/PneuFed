import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiUrl, parsePredictionResponse } from '../src/utils/api.js';

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
