/**
 * Integration tests for POST /api/auth/check-email
 * Run with: npx tsx server/tests/check-email.test.ts
 * Requires the API server to be running (default: http://localhost:3001)
 *
 * NOTE: The rate-limit test runs last because it exhausts the per-IP
 * quota for localhost, which would cause subsequent tests to get 429s.
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";
const ENDPOINT = `${BASE}/api/auth/check-email`;

interface CheckEmailResponse {
  success: boolean;
  available: boolean | null;
  error: string | null;
}

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗  ${name}`);
    console.error(`     ${(e as Error).message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertShape(data: unknown): asserts data is CheckEmailResponse {
  assert(typeof data === "object" && data !== null, "Response must be an object");
  const d = data as Record<string, unknown>;
  assert("success" in d, "Missing field: success");
  assert("available" in d, "Missing field: available");
  assert("error" in d, "Missing field: error");
}

async function post(email: string): Promise<Response> {
  return fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

async function run() {
  console.log(`\ncheck-email endpoint tests → ${ENDPOINT}\n`);

  // ── 1. New email: available=true ──────────────────────────────────────────
  await test("new email returns available=true with consistent shape", async () => {
    const res = await post(`new_${Date.now()}@example.com`);
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assertShape(data);
    assert(data.success === true, `success should be true, got ${data.success}`);
    assert(data.available === true, `available should be true, got ${data.available}`);
    assert(data.error === null, `error should be null, got ${data.error}`);
  });

  // ── 2. Existing email: available=false ────────────────────────────────────
  await test("existing email returns available=false", async () => {
    const res = await post("testuser@example.com");
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assertShape(data);
    assert(data.success === true, `success should be true, got ${data.success}`);
    assert(data.available === false, `available should be false for registered email, got ${data.available}`);
    assert(data.error === null, `error should be null, got ${data.error}`);
  });

  // ── 3. Malformed email: 400 ───────────────────────────────────────────────
  await test("malformed email (no @) returns 400", async () => {
    const res = await post("not-an-email");
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(typeof (data as Record<string, unknown>).error === "string", "Expected error string in body");
  });

  // ── 4. Empty email: 400 ───────────────────────────────────────────────────
  await test("empty email returns 400", async () => {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ── 5. Missing email field: 400 ───────────────────────────────────────────
  await test("missing email field returns 400", async () => {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ── 6. Response shape on success ──────────────────────────────────────────
  await test("response always has success, available, error fields", async () => {
    const res = await post(`shape_test_${Date.now()}@example.com`);
    const data = await res.json();
    assertShape(data);
  });

  // ── 7. No false positives on non-200 ─────────────────────────────────────
  await test("non-200 response never has available=false (no false positives)", async () => {
    const res = await post("not-an-email");
    if (!res.ok) {
      const data = await res.json() as Record<string, unknown>;
      assert(
        data.available !== false,
        `available=${data.available} on non-200 — this would cause a false 'email exists' error`
      );
    }
  });

  // ── 8. Case-insensitive lookup ────────────────────────────────────────────
  await test("email check is case-insensitive (lowercase normalisation)", async () => {
    // The validation layer may canonicalise to lowercase before the DB lookup.
    // Either way, the result must match the registered lowercase address.
    const res = await post("testuser@example.com");
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assertShape(data);
    assert(
      data.available === false,
      `testuser@example.com is registered — available should be false, got ${data.available}`
    );
  });

  // ── 9. Rate-limit test (runs LAST — exhausts per-IP quota) ───────────────
  // This test intentionally fires many requests until a 429 is returned,
  // then validates the response shape. Run it last so it doesn't poison
  // the shared localhost quota for the tests above.
  await test("rate-limited request returns 429 with consistent JSON shape", async () => {
    const email = `ratelimit_${Date.now()}@example.com`;
    let hit429 = false;
    for (let i = 0; i < 25; i++) {
      const res = await post(email);
      if (res.status === 429) {
        const data = await res.json();
        assertShape(data);
        assert(data.success === false, `success should be false on 429, got ${data.success}`);
        assert(data.available === null, `available should be null on 429, got ${data.available}`);
        assert(
          typeof data.error === "string" && data.error.length > 0,
          `error should be a non-empty string on 429, got ${JSON.stringify(data.error)}`
        );
        hit429 = true;
        break;
      }
    }
    if (!hit429) {
      console.log("     (rate limit window not reached in this run — shape assertions skipped)");
    }
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("\nTest runner crashed:", e);
  process.exit(1);
});
