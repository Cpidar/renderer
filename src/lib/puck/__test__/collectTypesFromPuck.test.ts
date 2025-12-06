// packages/ui-components/src/__tests__/collectTypesFromPuck.test.ts
import { collectTypesFromPuck } from '../puckUtils'; // Adjust path
import { type Data } from '@measured/puck';

describe('collectTypesFromPuck', () => {
  it('should collect types from content', () => {
    const data: Data = {
      content: [{ type: 'Hero', props: {} }, { type: 'Section', props: {} }],
      root: {},
    };
    const types = collectTypesFromPuck(data);
    expect(types).toEqual(new Set(['Page', 'Hero', 'Section']));
  });

  it('should collect types from nested slots', () => {
    const data: Data = {
      content: [
        {
          type: 'Grid',
          props: {
            items: [{ type: 'Item', props: {} }, { type: 'Item', props: {} }],
          },
        },
      ],
      root: {},
    };
    const types = collectTypesFromPuck(data);
    expect(types).toEqual(new Set(['Page', 'Grid', 'Item']));
  });

  it('should return empty set for null data', () => {
    const types = collectTypesFromPuck(null);
    expect(types.size).toBe(0);
  });

  it('should always include Page', () => {
    const data: Data = { content: [], root: {} };
    const types = collectTypesFromPuck(data);
    expect(types).toEqual(new Set(['Page']));
  });
});