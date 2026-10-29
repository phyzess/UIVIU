import { describe, expect, it } from "vitest";

import { estimateReadingMinutes } from "../../src/lib/reading-time";

const cjk = (count: number) => "字".repeat(count);
const words = (count: number) =>
  Array.from({ length: count }, (_, index) => `word${index}`).join(" ");

describe("estimateReadingMinutes", () => {
  it("reads about 400 Chinese characters per minute", () => {
    expect(estimateReadingMinutes(cjk(1))).toBe(1);
    expect(estimateReadingMinutes(cjk(400))).toBe(1);
    expect(estimateReadingMinutes(cjk(401))).toBe(2);
  });

  it("reads about 200 Latin words per minute", () => {
    expect(estimateReadingMinutes(words(200))).toBe(1);
    expect(estimateReadingMinutes(words(201))).toBe(2);
  });

  it("combines both scripts", () => {
    expect(estimateReadingMinutes(`${cjk(200)} ${words(100)}`)).toBe(1);
    expect(estimateReadingMinutes(`${cjk(400)} ${words(200)}`)).toBe(2);
  });

  it("ignores fenced and inline code", () => {
    const withCode = `${cjk(10)}\n\n\`\`\`ts\n${words(2000)}\n\`\`\`\n\n\`${words(50)}\``;
    expect(estimateReadingMinutes(withCode)).toBe(1);
  });

  it("never reports less than one minute", () => {
    expect(estimateReadingMinutes("")).toBe(1);
    expect(estimateReadingMinutes("短。")).toBe(1);
  });
});
