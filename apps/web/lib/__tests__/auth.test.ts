/**
 * Unit tests for lib/auth.ts
 *
 * Utility: decodeToken and getClientToken are pure functions with no
 * external dependencies — ideal targets for unit tests. They verify that:
 * - JWT base64 decoding returns the correct payload shape
 * - Invalid tokens are handled gracefully (never throw, return null)
 * - getClientToken correctly parses the cookie string
 *
 * These run in < 5ms with no network or filesystem access.
 */

import { decodeToken, getClientToken, isTokenExpired } from "../auth";

// Build a fake JWT with a known payload (no real signature needed — we only
// decode, never verify).
function makeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${body}.fakesignature`;
}

describe("decodeToken", () => {
  const NOW = Math.floor(Date.now() / 1000);

  it("returns the payload for a structurally valid JWT", () => {
    const payload = {
      sub: "user-1",
      email: "a@b.com",
      iat: NOW,
      exp: NOW + 3600,
    };
    const token = makeJwt(payload);

    const result = decodeToken(token);

    expect(result).toMatchObject({ sub: "user-1", email: "a@b.com" });
    expect(result?.exp).toBe(payload.exp);
  });

  it("returns null for an entirely invalid string", () => {
    expect(decodeToken("not-a-jwt")).toBeNull();
  });

  it("returns null for a JWT with a non-base64 payload", () => {
    expect(decodeToken("header.!!!.sig")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(decodeToken("")).toBeNull();
  });

  it("returns the payload even when the token is expired (we do not verify exp here)", () => {
    const past = NOW - 7200;
    const payload = { sub: "u", email: "e@e.com", iat: past - 3600, exp: past };
    const token = makeJwt(payload);

    const result = decodeToken(token);

    // decodeToken just decodes — expiry enforcement is caller's job
    expect(result).not.toBeNull();
    expect(result?.exp).toBe(past);
  });
});

describe("isTokenExpired", () => {
  const NOW = Math.floor(Date.now() / 1000);

  it("returns false for a token that has not expired yet", () => {
    const token = makeJwt({
      sub: "u",
      email: "e@e.com",
      iat: NOW,
      exp: NOW + 3600,
    });
    expect(isTokenExpired(token)).toBe(false);
  });

  it("returns true for an already-expired token", () => {
    const token = makeJwt({
      sub: "u",
      email: "e@e.com",
      iat: NOW - 7200,
      exp: NOW - 3600,
    });
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns true for an invalid token", () => {
    expect(isTokenExpired("garbage")).toBe(true);
  });
});

describe("getClientToken", () => {
  afterEach(() => {
    // Reset document.cookie after each test by expiring all set cookies.
    document.cookie = "token=; Max-Age=0; path=/";
    document.cookie = "other=; Max-Age=0; path=/";
  });

  it("returns the token value when the cookie is set", () => {
    document.cookie = "token=my.jwt.token";

    expect(getClientToken()).toBe("my.jwt.token");
  });

  it("returns undefined when no token cookie is present", () => {
    // No cookie set in this test.
    expect(getClientToken()).toBeUndefined();
  });

  it("returns the correct token when multiple cookies are present", () => {
    document.cookie = "other=value";
    document.cookie = "token=correct.jwt";

    expect(getClientToken()).toBe("correct.jwt");
  });
});
