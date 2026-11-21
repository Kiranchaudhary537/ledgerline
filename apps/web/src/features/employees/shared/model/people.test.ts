import { describe, expect, test } from 'vitest';
import { initials } from './people';

describe('initials', () => {
  test.each([
    ['Sandeep Singh', 'SS'],
    ['  anna maria de la Cruz ', 'AC'],
    ['Madonna', 'MA'],
    ['', '?'],
  ])('%j → %s', (name, expected) => expect(initials(name)).toBe(expected));
});
