import { describe, expect, it } from "vitest";
import { generatePromptKey } from "./generatePromptKey";

describe("generatePromptKey", () => {
    it("should generate prompt key for document extraction prompts", () => {
        expect(generatePromptKey("invoice", "pdf")).toBe("invoice/pdf");
    });

    it("should trim whitespace from both vertical and documentType", () => {
        expect(generatePromptKey("  invoice  ", "  pdf  ")).toBe("invoice/pdf");
    });

    it("should handle empty strings for vertical and documentType", () => {
        expect(generatePromptKey("", "")).toBe("/");
    });

    it("should handle empty string for vertical", () => {
        expect(generatePromptKey("", "pdf")).toBe("/pdf");
    });

    it("should handle empty string for documentType", () => {
        expect(generatePromptKey("invoice", "")).toBe("invoice/");
    });

    it("should handle whitespace-only strings", () => {
        expect(generatePromptKey("   ", "   ")).toBe("/");
    });

    it("should handle special characters in vertical and documentType", () => {
        expect(generatePromptKey("inv@!#oice", "pd$f")).toBe("inv@!#oice/pd$f");
    });

    it("should handle null and undefined inputs gracefully", () => {
        // @ts-expect-error
        expect(() => generatePromptKey(null, "pdf")).toThrow();
        // @ts-expect-error
        expect(() => generatePromptKey("invoice", undefined)).toThrow();
        // @ts-expect-error
        expect(() => generatePromptKey(undefined, undefined)).toThrow();
    });

    it("should handle numbers as input by throwing", () => {
        // @ts-expect-error
        expect(() => generatePromptKey(123, 456)).toThrow();
    });
});
