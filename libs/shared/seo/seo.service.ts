import { DOCUMENT, Inject, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ORIGIN, SITE_NAME } from './origin.token';
import { absoluteUrl } from './seo.text';

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  robots?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  titleSuffix?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly origin = inject(ORIGIN);

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  setHead(input: SeoInput): void {
    const fullTitle =
      input.titleSuffix === false || input.title === SITE_NAME
        ? input.title
        : `${input.title} — ${SITE_NAME}`;
    const url = absoluteUrl(this.origin, input.path);
    const image = input.image ?? absoluteUrl(this.origin, '/og-default.png');
    const robots = input.robots ?? 'index,follow';
    const type = input.type ?? 'website';

    this.title.setTitle(fullTitle);

    this.upsertName('description', input.description);
    this.upsertName('robots', robots);

    this.upsertProperty('og:site_name', SITE_NAME);
    this.upsertProperty('og:title', fullTitle);
    this.upsertProperty('og:description', input.description);
    this.upsertProperty('og:type', type);
    this.upsertProperty('og:url', url);
    this.upsertProperty('og:image', image);

    this.upsertName('twitter:card', 'summary_large_image');
    this.upsertName('twitter:title', fullTitle);
    this.upsertName('twitter:description', input.description);
    this.upsertName('twitter:image', image);

    this.setCanonical(url);
    this.setJsonLd(input.jsonLd);
  }

  private upsertName(name: string, content: string): void {
    if (!content) {
      this.meta.removeTag(`name="${name}"`);
      return;
    }
    this.meta.updateTag({ name, content });
  }

  private upsertProperty(property: string, content: string): void {
    if (!content) {
      this.meta.removeTag(`property="${property}"`);
      return;
    }
    this.meta.updateTag({ property, content });
  }

  private setCanonical(href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(jsonLd: SeoInput['jsonLd']): void {
    const head = this.document.head;
    head.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach((node) =>
      node.remove(),
    );
    if (!jsonLd) return;
    const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    for (const block of blocks) {
      const script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo', '');
      script.textContent = JSON.stringify(block);
      head.appendChild(script);
    }
  }
}
