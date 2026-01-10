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

  it('highlights multiple occurrences of placeholders', () => {
    const { container } = render(
      <MarkdownPreview
        content={'{{x}} then {{x}} then x-value'}
        id="md-preview-3"
      />
    );

    const highlighted = Array.from(container.querySelectorAll('span.pm-placeholder')).map(
      (el) => el.textContent
    );

    expect(highlighted).toEqual(['{{x}}', '{{x}}']);
  });

  it('does not highlight inside inline code or fenced code blocks', () => {
    const markdown = ['Inline: `{{name}}`', '', '```', 'Hello {{name}}', '```'].join('\n');

    const { container } = render(
      <MarkdownPreview content={markdown} id="md-preview-4" />
    );

    const highlighted = container.querySelectorAll('span.pm-placeholder');
    expect(highlighted.length).toBe(0);

    expect(container.textContent).toContain('{{name}}');
    expect(container.textContent).toContain('Hello {{name}}');
  });

  it('does not highlight substituted values (regression for short values like a/1)', () => {
    const { container } = render(
      <MarkdownPreview content={'a 1 table variables {{only_this}}'} id="md-preview-no-values" />
    );

    const highlighted = Array.from(container.querySelectorAll('span.pm-placeholder')).map(
      (el) => el.textContent
    );

    expect(highlighted).toEqual(['{{only_this}}']);
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

  it('renders GFM tables', () => {
    const markdown = ['| A | B |', '|---|---|', '| 1 | 2 |'].join('\n');

    const { container } = render(
      <MarkdownPreview content={markdown} id="md-preview-table" />
    );

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(container.textContent).toContain('A');
    expect(container.textContent).toContain('B');
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('2');
  });

  it('does not interpret raw HTML as HTML', () => {
    const { container } = render(
      <MarkdownPreview
        content={'<script>alert(1)</script>\n<div>hi</div>'}
        id="md-preview-html"
      />
    );

    expect(container.querySelector('script')).toBeNull();
    const wrapper = container.querySelector('#md-preview-html');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector('div')).toBeNull();
    expect(container.textContent).not.toContain('alert(1)');
    expect(container.textContent).not.toContain('hi');
  });

  it('highlights overlapping placeholder names without partial matches', () => {
    const { container } = render(
      <MarkdownPreview content={'{{a}} {{ab}} {{a}}'} id="md-preview-overlap-ph" />
    );

    const highlighted = Array.from(container.querySelectorAll('span.pm-placeholder')).map(
      (el) => el.textContent
    );

    expect(highlighted).toEqual(['{{a}}', '{{ab}}', '{{a}}']);
  });

  it('renders very large content without crashing', () => {
    const large = `${'A'.repeat(10000)} {{end}}`;
    const { container } = render(
      <MarkdownPreview content={large} id="md-preview-large" />
    );

    const highlighted = container.querySelectorAll('span.pm-placeholder');
    expect(highlighted.length).toBe(1);
    expect(highlighted[0]?.textContent).toBe('{{end}}');
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
