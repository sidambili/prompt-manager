import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { MarkdownPreview } from './MarkdownPreview';

describe('MarkdownPreview', () => {
  it('highlights literal {{...}} placeholders', () => {
    const { container } = render(
      <MarkdownPreview content={'Hello {{name}}'} id="md-preview-1" />
    );

    const highlighted = container.querySelectorAll('span.pm-placeholder');
    expect(highlighted.length).toBe(1);
    expect(highlighted[0]?.textContent).toBe('{{name}}');
  });

  it('highlights substituted values when highlightValues are provided', () => {
    const { container } = render(
      <MarkdownPreview
        content={'Hello Alice'}
        highlightValues={['Alice']}
        id="md-preview-2"
      />
    );

    const highlighted = container.querySelectorAll('span.pm-placeholder');
    expect(highlighted.length).toBe(1);
    expect(highlighted[0]?.textContent).toBe('Alice');
  });

  it('highlights multiple occurrences of placeholders and values', () => {
    const { container } = render(
      <MarkdownPreview
        content={'{{x}} then {{x}} then x-value'}
        highlightValues={['x-value']}
        id="md-preview-3"
      />
    );

    const highlighted = Array.from(container.querySelectorAll('span.pm-placeholder')).map(
      (el) => el.textContent
    );

    expect(highlighted).toEqual(['{{x}}', '{{x}}', 'x-value']);
  });

  it('treats highlightValues as literal strings (escapes regex metacharacters)', () => {
    const value = 'a+b*(c)?^$.[x]\\y|z';
    const { container } = render(
      <MarkdownPreview
        content={`before ${value} after`}
        highlightValues={[value]}
        id="md-preview-3b"
      />
    );

    const highlighted = container.querySelectorAll('span.pm-placeholder');
    expect(highlighted.length).toBe(1);
    expect(highlighted[0]?.textContent).toBe(value);
  });

  it('prioritizes longer highlight values over shorter overlapping ones', () => {
    const { container } = render(
      <MarkdownPreview
        content={'Value: foobar'}
        highlightValues={['foo', 'foobar']}
        id="md-preview-3c"
      />
    );

    const highlighted = Array.from(container.querySelectorAll('span.pm-placeholder')).map(
      (el) => el.textContent
    );

    expect(highlighted).toEqual(['foobar']);
  });

  it('does not highlight inside inline code or fenced code blocks', () => {
    const markdown = ['Inline: `{{name}}`', '', '```', 'Hello {{name}}', '```'].join('\n');

    const { container } = render(
      <MarkdownPreview content={markdown} highlightValues={['Hello']} id="md-preview-4" />
    );

    const highlighted = container.querySelectorAll('span.pm-placeholder');
    expect(highlighted.length).toBe(0);

    expect(container.textContent).toContain('{{name}}');
    expect(container.textContent).toContain('Hello {{name}}');
  });

  it('strips YAML frontmatter', () => {
    const markdown = ['---', 'title: Test', '---', '', 'Hello'].join('\n');

    const { container } = render(
      <MarkdownPreview content={markdown} id="md-preview-5" />
    );

    expect(container.textContent).toContain('Hello');
    expect(container.textContent).not.toContain('title: Test');
  });

  it('renders soft breaks as line breaks', () => {
    const { container } = render(
      <MarkdownPreview content={'line1\nline2'} id="md-preview-6" />
    );

    expect(container.querySelectorAll('br').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('line1');
    expect(container.textContent).toContain('line2');
  });

  it('blocks images from rendering', () => {
    const { container } = render(
      <MarkdownPreview
        content={'![alt](https://example.com/img.png)'}
        id="md-preview-7"
      />
    );

    expect(container.querySelectorAll('img').length).toBe(0);
  });

  it('renders external links with target _blank and rel noreferrer', () => {
    const { container } = render(
      <MarkdownPreview
        content={'[Example](https://example.com)'}
        id="md-preview-8"
      />
    );

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noreferrer');
  });

  it('does not render javascript: links as clickable anchors', () => {
    const { container } = render(
      <MarkdownPreview
        content={'[Bad](javascript:alert(1))'}
        id="md-preview-9"
      />
    );

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBeNull();
    expect(container.textContent).toContain('Bad');
  });

  it('renders internal links without forcing target _blank', () => {
    const { container } = render(
      <MarkdownPreview content={'[Internal](/login)'} id="md-preview-10" />
    );

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/login');
    expect(link?.getAttribute('target')).toBeNull();
  });
});
