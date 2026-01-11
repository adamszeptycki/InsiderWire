function formatNumberWithCommas(value: number | string): string {
	// Convert to string and remove any existing non-digit characters
	const numString = String(value).replace(/\D/g, "");

	// Use regex to add commas
	return numString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export { formatNumberWithCommas };
