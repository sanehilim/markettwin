import { describe, expect, it } from "vitest";

import { cmcPublicMessage, openAiPublicMessage } from "@/lib/provider-errors";

describe("provider public errors", () => {
  it("maps provider failures to sanitized CMC messages", () => {
    expect(cmcPublicMessage(429)).toContain("rate limits");
    expect(cmcPublicMessage(403)).toContain("plan");
    expect(cmcPublicMessage(500)).toContain("temporarily unavailable");
  });

  it("keeps OpenAI health failures generic", () => {
    expect(openAiPublicMessage()).not.toContain("sk-");
    expect(openAiPublicMessage()).toContain("deterministic");
  });
});
