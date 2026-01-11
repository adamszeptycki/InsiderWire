/**
 * Calculates the average of the provided scores
 * @param scores Array of numeric scores to average
 * @returns The average of the scores, or 0 if no valid scores provided
 */


export const calculateAverage = (scores: (number | null | undefined)[]): number => {
    const validScores = scores.filter((score): score is number => 
        typeof score === 'number' && !Number.isNaN(score)
    );
    
    if (validScores.length === 0) {
        return 0;
    }
    
    const sum = validScores.reduce((acc, score) => acc + score, 0);
    return sum / validScores.length;
};

/**
 * Calculates the weighted average of the provided value-weight pairs
 * @param pairs Array of objects containing value and weight properties
 * @returns The weighted average of the values, or 0 if no valid pairs provided
 */
export const calculateWeightedAverage = (
    pairs: { value: number | null | undefined; weight: number | null | undefined }[]
): number => {
    // Filter out invalid pairs, keeping only those where both value and weight are valid
    const validPairs = pairs.filter((pair): pair is { value: number; weight: number } => 
        typeof pair.value === 'number' && 
        !Number.isNaN(pair.value) &&
        typeof pair.weight === 'number' && 
        !Number.isNaN(pair.weight) &&
        pair.weight > 0
    );
    
    if (validPairs.length === 0) {
        return 0;
    }
    
    // Calculate weighted sum and total weight
    const weightedSum = validPairs.reduce((acc, { value, weight }) => acc + (value * weight), 0);
    const totalWeight = validPairs.reduce((acc, { weight }) => acc + weight, 0);
    
    if (totalWeight === 0) {
        return 0;
    }
    
    return weightedSum / totalWeight;
};
