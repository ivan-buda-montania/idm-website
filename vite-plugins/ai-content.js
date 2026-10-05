import { translations } from '../src/data/translations.js';
import { EMAIL, PHONE, SITE_NAME, SITE_URL } from '../src/data/contact.js';
import fs from 'node:fs';
import path from 'node:path';

// Emits llms-full.txt and a Markdown twin of every public page (/md/<lang>/...) from the catalog at build time,
// so the AI-facing content never drifts from the site. CloudFront serves these when a client asks for
// `Accept: text/markdown` or `?format=md` (see infra/lib/idm-website-stack.ts).

const LANGS = ['en', 'es'];
const TAG_LABEL_KEYS = { pharma: 'pharmaceutical', food: 'food', lab: 'laboratory', industry: 'industrial' };
const COUNTRY_KEYS = ['canada', 'usa', 'mexico', 'colombia', 'brazil', 'chile', 'spain'];
const LABELS = {
  en: { overview: 'Overview', features: 'Key features', specs: 'Technical specifications', spec: 'Specification', value: 'Value', industries: 'Industries', machinery: 'Machinery', markets: 'Markets served', contact: 'Contact', location: 'Location', phone: 'Phone', email: 'Email', catalog: 'Product catalog', about: 'About' },
  es: { overview: 'Descripción general', features: 'Características principales', specs: 'Especificaciones técnicas', spec: 'Especificación', value: 'Valor', industries: 'Industrias', machinery: 'Maquinaria', markets: 'Mercados atendidos', contact: 'Contacto', location: 'Ubicación', phone: 'Teléfono', email: 'Email', catalog: 'Catálogo de productos', about: 'Acerca de' },
};

const localize = (product, lang) => ({ ...product, ...product.es, ...(lang === 'en' ? product.en : {}) });
const productUrl = id => `${SITE_URL}/products?id=${id}`;
const bullets = items => items.map(i => `- ${i}`).join('\n');

function contactBlock(lang) {
  const t = translations[lang];
  const l = LABELS[lang];
  return [
    `## ${l.contact}`,
    '',
    `- ${l.phone}: ${t.contact.phone}`,
    `- WhatsApp: https://wa.me/${PHONE}`,
    `- ${l.email}: ${EMAIL}`,
    `- ${l.location}: ${t.contact.location}`,
    `- ${t.contact.responseTime}`,
  ].join('\n');
}

function productMarkdown(raw, lang, depth = 1) {
  const h = n => '#'.repeat(depth + n - 1);
  const t = translations[lang];
  const l = LABELS[lang];
  const p = localize(raw, lang);
  const tags = (raw.tags ?? []).map(k => t.filterTags[TAG_LABEL_KEYS[k]]).filter(Boolean);
  const out = [`${h(1)} ${p.name}`, '', `> ${p.lead}`, ''];
  if (tags.length) out.push(`${l.industries}: ${tags.join(', ')}`, '');
  out.push(`URL: ${productUrl(raw.id)}`, '');
  if (p.description?.length) out.push(`${h(2)} ${l.overview}`, '', p.description.join('\n\n'), '');
  if (p.features?.length) out.push(`${h(2)} ${l.features}`, '', bullets(p.features), '');
  if (p.specs?.length) {
    out.push(`${h(2)} ${l.specs}`, '', `| ${l.spec} | ${l.value} |`, '| --- | --- |');
    p.specs.forEach(([k, v]) => out.push(`| ${k} | ${v} |`));
    out.push('');
  }
  if (depth === 1) out.push(contactBlock(lang), '');
  return out.join('\n');
}

function machineryMarkdown(products, lang) {
  const l = LABELS[lang];
  const items = products.map(raw => {
    const p = localize(raw, lang);
    return `- [${p.name}](${productUrl(raw.id)}): ${p.desc}`;
  });
  return [`# ${l.machinery} · ${SITE_NAME}`, '', `> ${translations[lang].machinery.description}`, '', `## ${l.catalog}`, '', items.join('\n'), '', contactBlock(lang), ''].join('\n');
}

function homeMarkdown(products, lang) {
  const t = translations[lang];
  const l = LABELS[lang];
  const industries = Object.values(t.industries).join(', ');
  const markets = COUNTRY_KEYS.map(k => t.globalPresence[k].country).join(', ');
  const items = products.map(raw => `- [${localize(raw, lang).name}](${productUrl(raw.id)})`);
  return [
    `# ${SITE_NAME}`, '', `> ${t.hero.description}`, '',
    `## ${l.about}`, '', t.about.description1, '', t.about.description2, '',
    `${l.industries}: ${industries}`, '', `${l.markets}: ${markets}`, '',
    `## ${l.machinery}`, '', items.join('\n'), '',
    contactBlock(lang), '',
  ].join('\n');
}

function llmsFull(products) {
  const t = translations.en;
  return [
    `# ${SITE_NAME}`, '',
    `> ${t.hero.description}`, '',
    `Site: ${SITE_URL}`, '',
    t.about.description1, '', t.about.description2, '',
    '---', '',
    ...products.flatMap(p => [productMarkdown(p, 'en', 2), '---', '']),
    contactBlock('en'), '',
  ].join('\n');
}

export default function aiContent() {
  return {
    name: 'idm-ai-content',
    apply: 'build',
    generateBundle() {
      const catalogPath = path.resolve('public/data/catalog.json');
      const { products } = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      const emit = (fileName, source) => this.emitFile({ type: 'asset', fileName, source });

      emit('llms-full.txt', llmsFull(products));
      for (const lang of LANGS) {
        emit(`md/${lang}/index.md`, homeMarkdown(products, lang));
        emit(`md/${lang}/machinery.md`, machineryMarkdown(products, lang));
        for (const p of products) emit(`md/${lang}/products/${p.id}.md`, productMarkdown(p, lang));
      }
    },
  };
}
