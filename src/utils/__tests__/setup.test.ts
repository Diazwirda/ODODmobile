/**
 * Smoke test to verify Jest + TypeScript + path aliases are configured correctly.
 * This file can be removed once real tests are in place.
 */
import type {} from '@utils/index'; // verify path alias resolves

describe('Project setup', () => {
  it('Jest is configured correctly', () => {
    expect(true).toBe(true);
  });

  it('TypeScript types are available', () => {
    const value: string = 'hello';
    expect(typeof value).toBe('string');
  });

  it('fast-check is importable', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fc = require('fast-check');
    expect(typeof fc.assert).toBe('function');
    expect(typeof fc.property).toBe('function');
  });
});
