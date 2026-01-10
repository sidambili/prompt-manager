'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

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

  return (
    <div className={cn('pm-markdown', className)} id={id}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
