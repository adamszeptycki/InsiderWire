import crypto from "node:crypto";

/**
 * Generate a SHA-256 hash of a transcript line/utterance.
 * Used to create stable identifiers for linking knowledge bits to specific transcript lines.
 * 
 * @param text - The transcript text to hash
 * @returns Hexadecimal SHA-256 hash string
 */
export function hashTranscriptLine(text: string): string {
	return crypto.createHash("sha256").update(text.trim()).digest("hex");
}


export function calculateHash(text: string): string {
	return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

export function createCryptoHash(): crypto.Hash {
	return crypto.createHash("sha256");
}