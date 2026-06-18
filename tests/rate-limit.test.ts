import { describe, expect, it } from "vitest";

import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("limits requests per client key and emits headers", async () => {
    const request = new Request("https://markettwin.test/api/analyze", {
      headers: { "x-forwarded-for": "203.0.113.10" }
    });
    const policy = { name: `test-${crypto.randomUUID()}`, limit: 2, windowMs: 30_000 };

    const first = await checkRateLimit(request, policy);
    const second = await checkRateLimit(request, policy);
    const third = await checkRateLimit(request, policy);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(false);
    expect(rateLimitHeaders(third)["Retry-After"]).toBeDefined();
  });
});
