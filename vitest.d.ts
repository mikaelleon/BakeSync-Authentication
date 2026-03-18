declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export const expect: {
    (value: any): {
      toBe: (expected: any) => void;
      toEqual: (expected: any) => void;
      toBeNull: () => void;
      toBeTruthy: () => void;
      toBeFalsy: () => void;
      toContain: (item: any) => void;
      toHaveLength: (length: number) => void;
    };
  };
  export const vi: {
    mock: (path: string, factory: () => any) => void;
    fn: () => any;
    clearAllMocks: () => void;
  };
  export function beforeEach(fn: () => void | Promise<void>): void;
}


