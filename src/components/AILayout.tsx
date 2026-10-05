import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

export type Breadcrumb = { label: string; to: string };

type AILayoutProps = {
  children: ReactNode;
  breadcrumbs?: Breadcrumb[];
};

// Content landmarks for the page body: one <main> holding one <article>. Site chrome (navbar, footer, chat
// button) stays outside <main>, so scrapers and reader modes can take the page content without layout noise.
export default function AILayout({ children, breadcrumbs }: AILayoutProps) {
  const { pathname, search } = useLocation();
  const markdownHref = `${pathname}${search}${search ? '&' : '?'}format=md`;

  return (
    <main id="main-content">
      {/* Points agents at the Markdown twin of this page (served by CloudFront, see infra/). */}
      <link rel="alternate" type="text/markdown" href={markdownHref} />
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol style={{ display: 'flex', gap: '0.5rem', listStyle: 'none', margin: 0, padding: '1rem 2rem' }}>
            {breadcrumbs.map(({ label, to }) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}
          </ol>
        </nav>
      )}
      <article>{children}</article>
    </main>
  );
}

type AISectionProps = {
  children: ReactNode;
  /** Id of the heading inside the section, used to name the landmark. */
  labelledBy?: string;
  className?: string;
};

// A thematic block of an article. Give it the id of its heading so it reads as a named section.
export function AISection({ children, labelledBy, className }: AISectionProps) {
  return <section aria-labelledby={labelledBy} className={className}>{children}</section>;
}
