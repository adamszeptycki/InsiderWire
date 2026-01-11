// Helper function to generate prompt key for document extraction prompts
export const generatePromptKey = (vertical: string, documentType: string): string => {
	// Ensure consistent formatting by trimming and using consistent separators
	return `${vertical.trim()}/${documentType.trim()}`;
}
