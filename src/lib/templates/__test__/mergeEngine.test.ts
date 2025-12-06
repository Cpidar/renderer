// packages/ui-components/src/__tests__/mergeTemplateWithPage.test.ts
import { mergeTemplateWithPage } from '../mergeEngine'; // Adjust path if needed
import { type Data } from '@measured/puck';

describe('mergeTemplateWithPage', () => {
  it('should normalize and merge basic template with no overrides', () => {
    const baseTemplate = {
      content: [{ type: 'Hero', props: { title: 'Welcome' } }],
      tokens: { color: 'blue' },
    };
    const result = mergeTemplateWithPage(baseTemplate, {}, {});
    expect(result).toEqual({
      content: [{ type: 'Hero', props: { title: 'Welcome' } }],
      root: { props: { color: 'blue' } },
    } as Data);
  });

  it('should apply defaults to components', () => {
    const baseTemplate = {
      content: [{ type: 'Hero', props: { title: 'Welcome' } }],
      defaults: { Hero: { background: 'white' } },
    };
    const result = mergeTemplateWithPage(baseTemplate, {}, {});
    expect(result.content[0].props).toEqual({ title: 'Welcome', background: 'white' });
  });

  it('should merge tenant overrides into root props', () => {
    const baseTemplate = { root: { props: { color: 'blue' } } };
    const tenantOverrides = { color: 'red' };
    const result = mergeTemplateWithPage(baseTemplate, tenantOverrides, {});
    expect(result.root.props).toEqual({ color: 'red' });
  });

  it('should merge page overrides with ID-based array merge', () => {
    const baseTemplate = {
      content: [{ type: 'Section', props: { id: 'sec1', text: 'Old' } }],
    };
    const pageOverrides = {
      content: [{ type: 'Section', props: { id: 'sec1', text: 'New' } }],
    };
    const result = mergeTemplateWithPage(baseTemplate, {}, pageOverrides);
    expect(result.content[0].props.text).toBe('New');
  });

  it('should handle nested slots in defaults and merges', () => {
    const baseTemplate = {
      content: [
        {
          type: 'Grid',
          props: {
            items: [{ type: 'Item', props: { value: 1 } }],
          },
        },
      ],
      defaults: { Item: { color: 'red' } },
    };
    const pageOverrides = {
      content: [
        {
          type: 'Grid',
          props: {
            items: [{ type: 'Item', props: { value: 2 } }],
          },
        },
      ],
    };
    const result = mergeTemplateWithPage(baseTemplate, {}, pageOverrides);
    expect(result.content[0].props.items[0].props).toEqual({ value: 2, color: 'red' });
  });
});