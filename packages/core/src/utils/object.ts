import {deepCopy} from 'deepcopy-esm';

type ReplaceUndefinedWithNull<T> = 
  T extends undefined ? null :
  T extends (infer U)[] ? ReplaceUndefinedWithNull<U>[] :
  T extends object ? { [K in keyof T]: ReplaceUndefinedWithNull<T[K]> } :
  T;

type ReplaceNullWithUndefined<T> = 
  T extends null ? undefined :
  T extends (infer U)[] ? ReplaceNullWithUndefined<U>[] :
  T extends object ? { [K in keyof T]: ReplaceNullWithUndefined<T[K]> } :
  T;

export function replaceUndefinedWithNull<T>(obj: T | Partial<T>): ReplaceUndefinedWithNull<T> {
  if (obj === undefined) {
    return null as ReplaceUndefinedWithNull<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceUndefinedWithNull(item)) as ReplaceUndefinedWithNull<T>;
  }

  if (obj !== null && typeof obj === "object") {
    const result = {} as ReplaceUndefinedWithNull<T>;
    for (const [key, value] of Object.entries(obj)) {
      result[key as keyof ReplaceUndefinedWithNull<T>] = replaceUndefinedWithNull(value);
    }
    return result;
  }

  return obj as ReplaceUndefinedWithNull<T>;
}

export function replaceNullWithUndefined<T>(obj: T | Partial<T>): ReplaceNullWithUndefined<T> {
  if (obj === null) {
    return undefined as ReplaceNullWithUndefined<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceNullWithUndefined(item)) as ReplaceNullWithUndefined<T>;
  }

  if (obj !== null && typeof obj === "object") {
    const result = {} as ReplaceNullWithUndefined<T>;
    for (const [key, value] of Object.entries(obj)) {
      result[key as keyof ReplaceNullWithUndefined<T>] = replaceNullWithUndefined(value);
    }
    return result;
  }

  return obj as ReplaceNullWithUndefined<T>;
}

export function deepCopyandClean<T>(obj: T): T {
  return setFalsyToUndefined(deepCopy(obj));
}

/**
 * Recursively traverses an object and sets all falsy values to undefined.
 * Falsy values include: false, 0, "", null, undefined, NaN
 * 
 * @param obj - The object to process
 * @returns A new object with falsy values set to undefined
 */
export function setFalsyToUndefined<T>(obj: T): T {
  // Handle primitives and null/undefined
  if (obj === null || typeof obj !== "object") {
    // Return undefined for falsy values (except undefined itself)
    if (!obj && obj !== undefined) {
      return undefined as T;
    }
    return obj;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => setFalsyToUndefined(item)) as T;
  }

  // Handle Objects
  if (typeof obj === "object") {
    const result = {} as T;
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // If the value is falsy (but not undefined), set it to undefined
        if (!value && value !== undefined) {
          result[key] = undefined as T[Extract<keyof T, string>];
        } else {
          // Recursively process the value
          result[key] = setFalsyToUndefined(value);
        }
      }
    }
    
    return result;
  }

  return obj;
} 

/**
 * Replaces all single newlines in a string with double newlines, but leaves existing double newlines (even with spaces between them) untouched.
 * Also preserves single newlines when the line ends with "|" (for table formatting).
 * @param input The input string
 * @returns The string with single newlines replaced by double newlines
 */
export function replaceSingleNewlinesWithDouble(input: string): string {
    // This regex matches a single newline not preceded or followed by another newline (ignoring spaces)
    // We use negative lookbehind and lookahead to avoid double newlines (with optional spaces)
    // Also avoid replacing newlines when the line ends with "|" (for table formatting)
    return input.replace(/(?<!\n[ \t]*)(?<!\|)\n(?![ \t]*\n)/g, '\n\n');
}

/**
 * Checks if a value is a plain object.
 * @param value The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
