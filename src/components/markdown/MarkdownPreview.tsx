'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Text, Parent } from 'mdast';
import type { Plugin } from 'unified';

import { cn } from '@/lib/utils';

/**
 * Removes leading YAML frontmatter from a markdown string.
 * This prevents workflow/spec documents from showing their metadata block as plain text.
 */
function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
}

/**
 * Returns true when a link should not be rendered as clickable due to an unsafe protocol.
 */
function isUnsafeHref(href: string): boolean {
  return href.trim().toLowerCase().startsWith('javascript:');
}

/**
 * Returns true when a link is an absolute external HTTP(S) URL.
 */
function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

type HighlightText = Text & {
  data?: {
    hName?: string;
    hProperties?: {
      className?: string;
    };
  };
};

/**
 * Splits a text node into plain text, `{{...}}` placeholder segments, and highlight segments.
 * This is intended to run only for markdown text nodes (not code), so it does
 * not affect fenced/inline code rendering.
 */
function splitTextForHighlighting(
  text: string
): Array<{ type: 'text' | 'placeholder'; value: string }> {
  const pattern = /\{\{[^}]+\}\}/g;

  const segments: Array<{ type: 'text' | 'placeholder'; value: string }> = [];

  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const full = match[0] ?? '';
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, start) });
    }

    segments.push({ type: 'placeholder', value: full });
    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

function isCodeContainer(parent: Parent | undefined): boolean {
  if (!parent) return false;
  return parent.type === 'code' || parent.type === 'inlineCode';
}

function createHighlightPlugin(): Plugin<[], Root> {
  return () => {
    return (tree: Root) => {
      visit(tree, 'text', (node, index, parent) => {
        if (!parent || typeof index !== 'number') return;
        if (isCodeContainer(parent as Parent)) return;

        const segments = splitTextForHighlighting(node.value);
        if (segments.length <= 1) return;

        const replacementNodes: Array<Text> = segments.map((segment) => {
          if (segment.type === 'text') {
            return { type: 'text', value: segment.value };
          }

          const highlighted: HighlightText = {
            type: 'text',
            value: segment.value,
            data: {
              hName: 'span',
              hProperties: {
                className: 'pm-placeholder',
              },
            },
          };

          return highlighted;
        });

        const children = (parent as Parent).children;
        children.splice(index, 1, ...replacementNodes);
        return index + replacementNodes.length;
      });
    };
  };
}

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
  id: string;
}

/**
 * Renders user-visible markdown in a chat-like style.
 *
 * Security posture:
 * - Disallows raw HTML rendering.
 * - Sanitizes rendered output.
 * - Blocks images.
 * - Prevents unsafe `javascript:` links.
 */
export function MarkdownPreview({ content, className, id }: MarkdownPreviewProps) {
  const components: Components = {
    img: () => null,
    a: ({ href, children, ...props }) => {
      if (!href) {
        return <a {...props}>{children}</a>;
      }

      if (isUnsafeHref(href)) {
        return <span>{children}</span>;
      }

      const isExternal = isExternalHref(href);
      return (
        <a
          {...props}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noreferrer' : undefined}
          className={cn('underline underline-offset-4 hover:text-brand', props.className)}
        >
          {children}
        </a>
      );
    },
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto">
        <table {...props} className={cn('w-full border-collapse', props.className)}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th {...props} className={cn('border px-3 py-2 text-left text-xs font-semibold', props.className)}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td {...props} className={cn('border px-3 py-2 align-top text-xs', props.className)}>
        {children}
      </td>
    ),
    code: ({ children, ...props }) => (
      <code {...props} className={cn('font-mono text-[13px]', props.className)}>
        {children}
      </code>
    ),
    pre: ({ children, ...props }) => (
      <pre
        {...props}
        className={cn(
          'my-4 overflow-x-auto rounded-sm border bg-background/40 p-3 font-mono text-[13px]',
          props.className
        )}
      >
        {children}
      </pre>
    ),
  };

  const sanitized = stripFrontmatter(content);
  const highlightPlugin = createHighlightPlugin();

  const sanitizeSchema = {
    tagNames: ['span', 'a', 'strong', 'em', 'code', 'pre', 'blockquote', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    attributes: {
      '*': ['className'],
      a: ['href', 'target', 'rel'],
      span: ['className'],
    },
  };

  return (
    <div className={cn('pm-markdown', className)} id={id}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, highlightPlugin]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
