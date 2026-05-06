import { absoluteUrl, stripMarkdown } from './seo.text';

describe('stripMarkdown', () => {
  it('returns empty string for null, undefined, and empty input', () => {
    expect(stripMarkdown(null)).toBe('');
    expect(stripMarkdown(undefined)).toBe('');
    expect(stripMarkdown('')).toBe('');
  });

  it('strips fenced code blocks', () => {
    const input = 'Before\n```js\nconst x = 1;\n```\nAfter';
    expect(stripMarkdown(input)).toBe('Before After');
  });

  it('strips inline code spans', () => {
    expect(stripMarkdown('use `npm install` now')).toBe('use now');
  });

  it('removes images entirely', () => {
    expect(stripMarkdown('hello ![alt](http://x/y.png) world')).toBe('hello world');
  });

  it('preserves link text but drops the URL', () => {
    expect(stripMarkdown('see [the docs](https://example.com) please')).toBe(
      'see the docs please',
    );
  });

  it('removes markdown formatting characters and collapses whitespace', () => {
    expect(stripMarkdown('# Heading\n\n**bold** _italic_ ~strike~ > quote - item')).toBe(
      'Heading bold italic strike quote item',
    );
  });

  it('returns the full string when within the default max', () => {
    const input = 'Short and sweet.';
    expect(stripMarkdown(input)).toBe('Short and sweet.');
  });

  it('truncates at the last space with an ellipsis when past 60% of max', () => {
    const max = 20;
    const input = 'one two three four five six seven eight';
    const result = stripMarkdown(input, max);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(max + 1);
    expect(result).not.toMatch(/ …$/);
    const beforeEllipsis = result.slice(0, -1);
    expect(input.startsWith(beforeEllipsis)).toBe(true);
  });

  it('truncates at the slice boundary when the last space is too early', () => {
    const max = 20;
    const input = 'a' + ' ' + 'b'.repeat(40);
    const result = stripMarkdown(input, max);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/ …$/);
    expect(result.slice(0, -1)).toBe(('a ' + 'b'.repeat(40)).slice(0, max));
  });

  it('honours a custom max length', () => {
    const input = 'word '.repeat(80).trim();
    const result = stripMarkdown(input, 300);
    expect(result.length).toBeLessThanOrEqual(301);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('absoluteUrl', () => {
  const origin = 'https://example.test';

  it('returns origin when path is empty', () => {
    expect(absoluteUrl(origin, '')).toBe(origin);
  });

  it('passes through absolute http URLs unchanged', () => {
    expect(absoluteUrl(origin, 'http://other.test/foo')).toBe('http://other.test/foo');
  });

  it('passes through absolute https URLs unchanged', () => {
    expect(absoluteUrl(origin, 'https://other.test/foo')).toBe('https://other.test/foo');
  });

  it('prefixes a leading slash when missing', () => {
    expect(absoluteUrl(origin, 'episodes/1')).toBe('https://example.test/episodes/1');
  });

  it('preserves an existing leading slash without doubling it', () => {
    expect(absoluteUrl(origin, '/episodes/1')).toBe('https://example.test/episodes/1');
  });
});
