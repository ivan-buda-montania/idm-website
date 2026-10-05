import { createPortal } from 'react-dom';

type SchemaInjectorProps = {
  /** schema.org type, e.g. 'Organization', 'WebSite', 'Article', 'Product'. */
  type: string;
  /** The type's properties; `@context` and `@type` are added for you. */
  data: Record<string, unknown>;
};

// Injects a JSON-LD block into <head> while mounted. Because the site is a client-rendered SPA, this is only seen
// by crawlers that run JavaScript. Site-wide Organization/WebSite data is therefore also inlined in index.html.
export default function SchemaInjector({ type, data }: SchemaInjectorProps) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@type': type, ...data })
    .replace(/</g, '\\u003c'); // keep a "</script>" inside a value from ending the block

  return createPortal(<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />, document.head);
}
