/**
 * Generate a SHA-256 hash of a transcript line/utterance on the client side.
 * Used to create stable identifiers for linking knowledge bits to specific transcript lines.
 * 
 * @param text - The transcript text to hash
 * @returns Hexadecimal SHA-256 hash string
 */
export async function hashTranscriptLine(text: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(text.trim());
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
	return hashHex;
}

