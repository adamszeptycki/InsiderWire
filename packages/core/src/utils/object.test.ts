import { describe, expect, test } from 'vitest'
import { isPlainObject, replaceSingleNewlinesWithDouble, setFalsyToUndefined, replaceUndefinedWithNull, replaceNullWithUndefined } from './object';

describe('setFalsyToUndefined', () => {
  test('should set falsy values to undefined', () => {
    const original = {
      truthy: 'hello',
      falsyString: '',
      falsyNumber: 0,
      falsyBoolean: false,
      nullValue: null,
      undefinedValue: undefined,
      validNumber: 42,
      validBoolean: true
    };

    const result = setFalsyToUndefined(original);
    
    expect(result.truthy).toBe('hello');
    expect(result.falsyString).toBeUndefined();
    expect(result.falsyNumber).toBeUndefined();
    expect(result.falsyBoolean).toBeUndefined();
    expect(result.nullValue).toBeUndefined();
    expect(result.undefinedValue).toBeUndefined();
    expect(result.validNumber).toBe(42);
    expect(result.validBoolean).toBe(true);
  });

  test('should work recursively on nested objects', () => {
    const original = {
      user: {
        name: 'John',
        email: '',
        settings: {
          notifications: false,
          theme: 'dark',
          count: 0
        }
      },
      items: [
        { id: 1, name: 'Item 1', active: true },
        { id: 2, name: '', active: false },
        { id: 0, name: 'Item 3', active: null }
      ]
    };

    const result = setFalsyToUndefined(original);
    
    expect(result.user.name).toBe('John');
    expect(result.user.email).toBeUndefined();
    expect(result.user.settings.notifications).toBeUndefined();
    expect(result.user.settings.theme).toBe('dark');
    expect(result.user.settings.count).toBeUndefined();
    
    expect(result.items[0].id).toBe(1);
    expect(result.items[0].active).toBe(true);
    expect(result.items[1].name).toBeUndefined();
    expect(result.items[1].active).toBeUndefined();
    expect(result.items[2].id).toBeUndefined();
    expect(result.items[2].active).toBeUndefined();
  });

  test('should handle arrays', () => {
    const original = ['hello', '', 0, false, null, 'world', 42];
    const result = setFalsyToUndefined(original);
    
    expect(result).toEqual(['hello', undefined, undefined, undefined, undefined, 'world', 42]);
  });

  test('should handle primitives', () => {
    expect(setFalsyToUndefined('')).toBeUndefined();
    expect(setFalsyToUndefined(0)).toBeUndefined();
    expect(setFalsyToUndefined(false)).toBeUndefined();
    expect(setFalsyToUndefined(null)).toBeUndefined();
    expect(setFalsyToUndefined(undefined)).toBeUndefined();
    expect(setFalsyToUndefined('hello')).toBe('hello');
    expect(setFalsyToUndefined(42)).toBe(42);
    expect(setFalsyToUndefined(true)).toBe(true);
  });
}); 

describe('replaceSingleNewlinesWithDouble', () => {
  test('handles tables correctly', () => {
    expect(replaceSingleNewlinesWithDouble('| a | b | c |\n|---|---|---|\n| d | e | f |')).toBe('| a | b | c |\n|---|---|---|\n| d | e | f |');
  })
    test('replaces single newlines with double newlines', () => {
        expect(replaceSingleNewlinesWithDouble('a\nb\nc')).toBe('a\n\nb\n\nc');
    });
    test('does not replace double newlines', () => {
        expect(replaceSingleNewlinesWithDouble('a\n\nb')).toBe('a\n\nb');
    });
    test('replace one new line with space with double newlines and persists space', () => {
      expect(replaceSingleNewlinesWithDouble('a\n b')).toBe('a\n\n b');
      expect(replaceSingleNewlinesWithDouble('a \nb')).toBe('a \n\nb');
    });

    test('does not replace double newlines with spaces between', () => {
        expect(replaceSingleNewlinesWithDouble('a\n  \nb')).toBe('a\n  \nb');
    });
    test('handles mixed single and double newlines', () => {
        expect(replaceSingleNewlinesWithDouble('a\nb\n\nc')).toBe('a\n\nb\n\nc');
    });
    test('handles leading and trailing newlines', () => {
        expect(replaceSingleNewlinesWithDouble('\na\nb\n')).toBe('\n\na\n\nb\n\n');
    });
    test('handles empty string', () => {
        expect(replaceSingleNewlinesWithDouble('')).toBe('');
    });
    test('handles only newlines', () => {
        expect(replaceSingleNewlinesWithDouble('\n')).toBe('\n\n');
        expect(replaceSingleNewlinesWithDouble('\n\n')).toBe('\n\n');
        expect(replaceSingleNewlinesWithDouble('\n  \n')).toBe('\n  \n');
    });
});

describe('isPlainObject', () => {
  test('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
  });
  test('should return false for arrays', () => {
    expect(isPlainObject([])).toBe(false);
  });
  test('should return false for functions', () => {
    expect(isPlainObject(() => {})).toBe(false);
  });
  test('should return false for null', () => {
    expect(isPlainObject(null)).toBe(false);
  });
  test('should return false for undefined', () => {
    expect(isPlainObject(undefined)).toBe(false);
  });
  test('should return false for boolean', () => {
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(false)).toBe(false);
  });
  // test('should return false for objects with prototype', () => {
  //   expect(isPlainObject(Object.create({}))).toBe(false);
  // });
  // test('should return false for objects with getters and setters', () => {
  //   expect(isPlainObject(Object.create({ get: () => {}, set: () => {} }))).toBe(false);
  // });
  // test('should return false for objects with symbols', () => {
  //   expect(isPlainObject(Object.create(Object.getPrototypeOf({})))).toBe(false);
  // });
});

describe('replaceUndefinedWithNull', () => {
  test('replaces undefined primitive with null and leaves others unchanged', () => {
    expect(replaceUndefinedWithNull(undefined)).toBeNull();
    expect(replaceUndefinedWithNull(null)).toBeNull();
    expect(replaceUndefinedWithNull('hello')).toBe('hello');
    expect(replaceUndefinedWithNull(0)).toBe(0);
    expect(replaceUndefinedWithNull(false)).toBe(false);
  });

  test('replaces undefined values inside arrays', () => {
    const input = [1, undefined, null, 'a', undefined];
    const output = replaceUndefinedWithNull(input);
    expect(output).toEqual([1, null, null, 'a', null]);
  });

  test('recursively replaces undefined in nested objects and arrays', () => {
    const input = {
      a: 1,
      b: undefined,
      c: {
        d: undefined,
        e: 'x',
        f: [undefined, { g: undefined, h: 2 }]
      },
      i: [1, { j: undefined }, 3]
    } as const;

    const output = replaceUndefinedWithNull(input);

    expect(output).toEqual({
      a: 1,
      b: null,
      c: {
        d: null,
        e: 'x',
        f: [null, { g: null, h: 2 }]
      },
      i: [1, { j: null }, 3]
    });
  });

  test('does not mutate the original object', () => {
    const original = { a: undefined, nested: { b: undefined }, arr: [undefined] };

    const result = replaceUndefinedWithNull(original);

    // Original remains the same (with undefined values present)
    expect(Object.hasOwn(original, 'a')).toBe(true);
    expect(original.a).toBeUndefined();
    expect(Object.hasOwn(original.nested, 'b')).toBe(true);
    expect(original.nested.b).toBeUndefined();
    expect(original.arr[0]).toBeUndefined();

    // Ensure new references were created
    expect(result).not.toBe(original);
    expect(result.nested).not.toBe(original.nested);
    expect(result.arr).not.toBe(original.arr);

    // Result has nulls instead of undefined
    expect(result).toEqual({ a: null, nested: { b: null }, arr: [null] });
  });

  test('leaves existing null values as null', () => {
    const input = { a: null, b: [null, { c: null }] };
    const output = replaceUndefinedWithNull(input);
    expect(output).toEqual({ a: null, b: [null, { c: null }] });
  });
});

describe('replaceNullWithUndefined', () => {
  test('replaces null primitive with undefined and leaves others unchanged', () => {
    expect(replaceNullWithUndefined(null)).toBeUndefined();
    expect(replaceNullWithUndefined(undefined)).toBeUndefined();
    expect(replaceNullWithUndefined('hello')).toBe('hello');
    expect(replaceNullWithUndefined(0)).toBe(0);
    expect(replaceNullWithUndefined(false)).toBe(false);
  });

  test('replaces null values inside arrays', () => {
    const input = [1, null, undefined, 'a', null];
    const output = replaceNullWithUndefined(input);
    expect(output).toEqual([1, undefined, undefined, 'a', undefined]);
  });

  test('recursively replaces null in nested objects and arrays', () => {
    const input = {
      a: 1,
      b: null,
      c: {
        d: null,
        e: 'x',
        f: [null, { g: null, h: 2 }]
      },
      i: [1, { j: null }, 3]
    } as const;

    const output = replaceNullWithUndefined(input);

    expect(output).toEqual({
      a: 1,
      b: undefined,
      c: {
        d: undefined,
        e: 'x',
        f: [undefined, { g: undefined, h: 2 }]
      },
      i: [1, { j: undefined }, 3]
    });
  });

  test('does not mutate the original object', () => {
    const original = { a: null, nested: { b: null }, arr: [null] };

    const result = replaceNullWithUndefined(original);

    // Original remains the same (with null values present)
    expect(Object.hasOwn(original, 'a')).toBe(true);
    expect(original.a).toBeNull();
    expect(Object.hasOwn(original.nested, 'b')).toBe(true);
    expect(original.nested.b).toBeNull();
    expect(original.arr[0]).toBeNull();

    // Ensure new references were created
    expect(result).not.toBe(original);
    expect(result.nested).not.toBe(original.nested);
    expect(result.arr).not.toBe(original.arr);

    // Result has undefined instead of null
    expect(result).toEqual({ a: undefined, nested: { b: undefined }, arr: [undefined] });
  });

  test('leaves existing undefined values as undefined', () => {
    const input = { a: undefined, b: [undefined, { c: undefined }] };
    const output = replaceNullWithUndefined(input);
    expect(output).toEqual({ a: undefined, b: [undefined, { c: undefined }] });
  });
});
