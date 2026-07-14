/**
 * smoke.test.js — PathshalaKhoj API Smoke Tests
 *
 * Uses Node's built-in `node:test` (available since Node 22) and `node:assert`.
 * Run with:  node smoke.test.js
 *
 * These tests verify the most critical routes are alive and returning
 * expected shapes WITHOUT requiring an external test framework.
 *
 * NOTE: The server must be running at http://localhost:4000 before running tests.
 *       Start it with: npm start  (in another terminal)
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:4000';

// ─── Helper ───────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const res  = await fetch(`${BASE}${path}`, options);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ─── Health ───────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  test('returns 200 and status ok', async () => {
    const { status, body } = await api('/api/health');
    assert.equal(status, 200, 'Expected HTTP 200');
    assert.equal(body.status, 'ok', 'Expected status:"ok"');
    assert.ok(body.time, 'Expected a time field');
  });
});

// ─── Colleges ─────────────────────────────────────────────────────────────
describe('GET /api/colleges', () => {
  test('returns 200 with data array', async () => {
    const { status, body } = await api('/api/colleges');
    assert.equal(status, 200, 'Expected HTTP 200');
    assert.ok(Array.isArray(body.data), 'Expected body.data to be an array');
    // The colleges API wraps total inside pagination object
    assert.ok(typeof body.pagination.total === 'number', 'Expected body.pagination.total to be a number');
  });

  test('search by query returns relevant results', async () => {
    const { status, body } = await api('/api/colleges?q=mumbai');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
  });

  test('filter by stream returns colleges', async () => {
    const { status, body } = await api('/api/colleges?stream=Engineering');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
  });
});

describe('GET /api/colleges/stats', () => {
  test('returns stats shape', async () => {
    const { status, body } = await api('/api/colleges/stats');
    assert.equal(status, 200);
    assert.ok(typeof body.collegesCount === 'number');
    assert.ok(typeof body.examsCount === 'number');
    assert.ok(typeof body.avgPlacement === 'string' || typeof body.avgPlacement === 'number');
  });
});

describe('GET /api/colleges/meta/filters', () => {
  test('returns filter metadata', async () => {
    const { status, body } = await api('/api/colleges/meta/filters');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.streams), 'Expected streams array');
    assert.ok(Array.isArray(body.states),  'Expected states array');
    assert.ok(Array.isArray(body.types),   'Expected types array');
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  test('registers a new user and returns 201 with token', async () => {
    const email = `test_${Date.now()}@example.com`;
    const { status, body } = await api('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'Test User', email, password: 'Test@12345' }),
    });
    assert.equal(status, 201, `Expected 201, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.token, 'Expected a JWT token in the response');
    assert.equal(body.user.email, email);
    assert.equal(body.user.role, 'user');
  });

  test('rejects duplicate email with 409', async () => {
    // First register
    const email = `dup_${Date.now()}@example.com`;
    await api('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'Dup User', email, password: 'Test@12345' }),
    });
    // Register again — should fail
    const { status } = await api('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'Dup User', email, password: 'Test@12345' }),
    });
    assert.equal(status, 409, 'Expected 409 for duplicate email');
  });

  test('rejects weak password with 400', async () => {
    const { status } = await api('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'Bad Pass', email: `bad_${Date.now()}@x.com`, password: '123' }),
    });
    assert.equal(status, 400);
  });
});

describe('POST /api/auth/login', () => {
  test('returns 200 with token for valid credentials', async () => {
    // Register first
    const email = `login_${Date.now()}@example.com`;
    await api('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'Login Test', email, password: 'Test@12345' }),
    });
    // Then login
    const { status, body } = await api('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password: 'Test@12345' }),
    });
    assert.equal(status, 200);
    assert.ok(body.token);
  });

  test('rejects wrong password with 401', async () => {
    const email = `wrongpw_${Date.now()}@example.com`;
    await api('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'Wrong PW', email, password: 'Test@12345' }),
    });
    const { status } = await api('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password: 'wrongpassword' }),
    });
    assert.equal(status, 401);
  });
});

describe('GET /api/auth/me', () => {
  test('returns 401 without token', async () => {
    const { status } = await api('/api/auth/me');
    assert.equal(status, 401);
  });

  test('returns user data with valid token', async () => {
    const email = `me_${Date.now()}@example.com`;
    const { body: regBody } = await api('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'Me Test', email, password: 'Test@12345' }),
    });
    const { status, body } = await api('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${regBody.token}` },
    });
    assert.equal(status, 200);
    assert.equal(body.user.email, email);
    assert.ok(typeof body.user.has_local_password === 'boolean');
    // Verify no sensitive fields are exposed
    assert.equal(body.user.password_hash, undefined, 'password_hash should not be in /me response');
    assert.equal(body.user.password_reset_token, undefined, 'reset token should not be in /me response');
  });
});

// ─── Shortlist ────────────────────────────────────────────────────────────
describe('Shortlist CRUD', () => {
  const sessionId = `test_session_${Date.now()}`;

  test('GET empty shortlist returns empty array', async () => {
    const { status, body } = await api(`/api/shortlist/${sessionId}`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 0);
  });

  test('DELETE non-existent item returns 404', async () => {
    const { status } = await api(`/api/shortlist/${sessionId}/999999`, { method: 'DELETE' });
    assert.equal(status, 404);
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────
describe('API 404', () => {
  test('returns 404 for unknown routes', async () => {
    const { status } = await api('/api/this-route-does-not-exist');
    assert.equal(status, 404);
  });
});

console.log('\n✅ All smoke tests completed.\n');
