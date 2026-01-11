/**
 * Splits an array into chunks of a specified size
 * @param array - The array to chunk
 * @param chunkSize - The size of each chunk
 * @returns An array of chunks
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    if (chunkSize <= 0) {
        throw new Error("Chunk size must be greater than 0");
    }
    
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

/**
 * Removes duplicates from an array based on a specified key
 * @param array - The array to remove duplicates from
 * @param key - The key to use for determining uniqueness (property name or function)
 * @returns A new array with duplicates removed (keeps last occurrence)
 */
function removeDuplicatesByKey<T>(
    array: T[], 
    key: keyof T | ((item: T) => any)
): T[] {
    if (array.length === 0) {
        return [];
    }
    
    const seen = new Set();
    const result: T[] = [];
    // reverse array to have "latest element in array as the one that we will keep at the end"
    const reversedArray = [...array].reverse();
    for (const item of reversedArray) {
        const keyValue = typeof key === 'function' ? key(item) : item[key];
        
        if (!seen.has(keyValue)) {
            seen.add(keyValue);
            result.push(item);
        }
    }
    
    return result;
}

export {chunkArray, removeDuplicatesByKey}