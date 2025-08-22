import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';

// Import CommonJS server in ESM test environment
const { default: app } = await vi.importActual('../ai-server.js');

// Mock node-fetch to return a simulated OpenAI chat completion
import fetch from 'node-fetch';
const { Response } = fetch;

vi.mock('node-fetch', async () => {
  const actual = await vi.importActual('node-fetch');
  const { Response } = actual;
  return {
    ...actual,
    default: vi.fn(async (url, opts) => {
      const fakeOpenAIResponse = {
        choices: [
          { message: { content: JSON.stringify({ meals: [], daily_calories: 2000, grocery_list: [] }) } }
        ]
      };
      return new Response(JSON.stringify(fakeOpenAIResponse), { status: 200 });
    })
  };
});

describe('AI proxy server', () => {
  it('parses and returns JSON from OpenAI', async () => {
    const res = await request(app)
      .post('/api/ai/meal-plan/generate')
      .send({ userProfile: { age: 30 } })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.parsed).toBeDefined();
    expect(res.body.parsed.daily_calories).toBe(2000);
  });
});
