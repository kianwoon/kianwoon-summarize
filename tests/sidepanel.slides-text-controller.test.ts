import { describe, expect, it } from "vitest";
import { createSlidesTextController } from "../apps/chrome-extension/src/entrypoints/sidepanel/slides-text-controller.js";

describe("sidepanel slides text controller", () => {
  it("builds transcript-first descriptions from timed text", () => {
    const slides = [
      { index: 1, timestamp: 0, imageUrl: "x", ocrText: "Ignored OCR text" },
      { index: 2, timestamp: 30, imageUrl: "y", ocrText: "Fallback OCR text for second slide" },
    ];
    const controller = createSlidesTextController({
      getSlides: () => slides,
      getLengthValue: () => "short",
      getSlidesOcrEnabled: () => true,
    });

    controller.setTranscriptTimedText(
      "[00:00] Intro text for the first slide.\n[00:30] Transcript text for the second slide.",
    );
    controller.syncTextState();

    expect(controller.getTranscriptAvailable()).toBe(true);
    expect(controller.getDescriptions().get(1)).toContain("Intro text");
    expect(controller.getDescriptions().get(2)).toContain("Transcript text");
  });

  it("keeps slides-derived titles authoritative over summary titles", () => {
    const controller = createSlidesTextController({
      getSlides: () => [{ index: 1, timestamp: 2, imageUrl: "x", ocrText: null }],
      getLengthValue: () => "short",
      getSlidesOcrEnabled: () => true,
    });

    expect(
      controller.updateSummaryFromMarkdown(
        ["### Slides", "Slide 1 · 0:02", "Canonical title", "Slide body text"].join("\n"),
        { source: "slides" },
      ),
    ).toBe(true);
    expect(controller.getTitles().get(1)).toBe("Canonical title");

    expect(
      controller.updateSummaryFromMarkdown(
        ["### Slides", "Slide 1 · 0:02", "Wrong title", "Other body text"].join("\n"),
        { source: "summary" },
      ),
    ).toBe(false);
    expect(controller.getTitles().get(1)).toBe("Canonical title");
  });

  it("preserves existing titles when asked to ignore empty updates", () => {
    const controller = createSlidesTextController({
      getSlides: () => [{ index: 1, timestamp: 2, imageUrl: "x", ocrText: null }],
      getLengthValue: () => "short",
      getSlidesOcrEnabled: () => true,
    });

    controller.updateSummaryFromMarkdown(
      ["### Slides", "Slide 1 · 0:02", "Kept title", "Some text"].join("\n"),
      { source: "summary" },
    );
    expect(controller.getTitles().get(1)).toBe("Kept title");

    expect(
      controller.updateSummaryFromMarkdown("", {
        source: "summary",
        preserveIfEmpty: true,
      }),
    ).toBe(false);
    expect(controller.getTitles().get(1)).toBe("Kept title");
  });
});
