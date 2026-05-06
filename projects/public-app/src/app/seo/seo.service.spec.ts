import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ORIGIN, SITE_NAME } from './origin.token';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ORIGIN, useValue: 'https://example.test' }],
    });
    service = TestBed.inject(SeoService);
    document.head.querySelectorAll('link[rel="canonical"]').forEach((n) => n.remove());
    document.head
      .querySelectorAll('script[type="application/ld+json"][data-seo]')
      .forEach((n) => n.remove());
    document.head
      .querySelectorAll('meta[name], meta[property]')
      .forEach((n) => {
        const name = n.getAttribute('name') || n.getAttribute('property') || '';
        if (
          name === 'description' ||
          name === 'robots' ||
          name.startsWith('og:') ||
          name.startsWith('twitter:')
        ) {
          n.remove();
        }
      });
  });

  it('should set title with site-name suffix and canonical url', () => {
    service.setHead({
      title: 'My Page',
      description: 'desc',
      path: '/my-page',
    });

    expect(TestBed.inject(Title).getTitle()).toBe(`My Page — ${SITE_NAME}`);
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://example.test/my-page');
  });

  it('should populate og, twitter, description, and robots meta tags with defaults', () => {
    service.setHead({
      title: 'My Page',
      description: 'A description',
      path: '/p',
    });
    const meta = TestBed.inject(Meta);

    expect(meta.getTag('name="description"')?.content).toBe('A description');
    expect(meta.getTag('name="robots"')?.content).toBe('index,follow');
    expect(meta.getTag('property="og:site_name"')?.content).toBe(SITE_NAME);
    expect(meta.getTag('property="og:title"')?.content).toBe(`My Page — ${SITE_NAME}`);
    expect(meta.getTag('property="og:description"')?.content).toBe('A description');
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
    expect(meta.getTag('property="og:url"')?.content).toBe('https://example.test/p');
    expect(meta.getTag('property="og:image"')?.content).toBe(
      'https://example.test/og-default.png',
    );
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
    expect(meta.getTag('name="twitter:title"')?.content).toBe(`My Page — ${SITE_NAME}`);
    expect(meta.getTag('name="twitter:description"')?.content).toBe('A description');
    expect(meta.getTag('name="twitter:image"')?.content).toBe(
      'https://example.test/og-default.png',
    );
  });

  it('should not append site-name suffix when titleSuffix is false', () => {
    service.setHead({
      title: 'Standalone',
      description: 'd',
      path: '/x',
      titleSuffix: false,
    });
    expect(TestBed.inject(Title).getTitle()).toBe('Standalone');
  });

  it('should not append site-name suffix when title equals SITE_NAME', () => {
    service.setHead({
      title: SITE_NAME,
      description: 'd',
      path: '/',
    });
    expect(TestBed.inject(Title).getTitle()).toBe(SITE_NAME);
  });

  it('should respect custom robots, type, and image overrides', () => {
    service.setHead({
      title: 'Article',
      description: 'd',
      path: '/a',
      robots: 'noindex,nofollow',
      type: 'article',
      image: 'https://cdn.example/img.png',
    });
    const meta = TestBed.inject(Meta);

    expect(meta.getTag('name="robots"')?.content).toBe('noindex,nofollow');
    expect(meta.getTag('property="og:type"')?.content).toBe('article');
    expect(meta.getTag('property="og:image"')?.content).toBe('https://cdn.example/img.png');
    expect(meta.getTag('name="twitter:image"')?.content).toBe('https://cdn.example/img.png');
  });

  it('should remove description meta tag when description is empty', () => {
    service.setHead({
      title: 'T',
      description: '',
      path: '/p',
    });
    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="description"')).toBeNull();
  });

  it('should reuse the existing canonical link element across calls', () => {
    service.setHead({ title: 'A', description: 'd', path: '/a' });
    const first = document.head.querySelector('link[rel="canonical"]');

    service.setHead({ title: 'B', description: 'd', path: '/b' });
    const links = document.head.querySelectorAll('link[rel="canonical"]');

    expect(links.length).toBe(1);
    expect(links[0]).toBe(first);
    expect(links[0].getAttribute('href')).toBe('https://example.test/b');
  });

  it('should write a single JSON-LD script when given an object', () => {
    const jsonLd = { '@context': 'https://schema.org', '@type': 'WebSite' };
    service.setHead({ title: 'T', description: 'd', path: '/', jsonLd });

    const scripts = document.head.querySelectorAll('script[type="application/ld+json"][data-seo]');
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0].textContent || '')).toEqual(jsonLd);
  });

  it('should write multiple JSON-LD scripts when given an array', () => {
    const jsonLd = [
      { '@context': 'https://schema.org', '@type': 'WebSite' },
      { '@context': 'https://schema.org', '@type': 'Organization' },
    ];
    service.setHead({ title: 'T', description: 'd', path: '/', jsonLd });

    const scripts = document.head.querySelectorAll('script[type="application/ld+json"][data-seo]');
    expect(scripts.length).toBe(2);
    expect(JSON.parse(scripts[0].textContent || '')).toEqual(jsonLd[0]);
    expect(JSON.parse(scripts[1].textContent || '')).toEqual(jsonLd[1]);
  });

  it('should remove prior JSON-LD scripts on subsequent calls', () => {
    service.setHead({
      title: 'T',
      description: 'd',
      path: '/',
      jsonLd: { '@type': 'WebSite' },
    });
    expect(
      document.head.querySelectorAll('script[type="application/ld+json"][data-seo]').length,
    ).toBe(1);

    service.setHead({ title: 'T', description: 'd', path: '/' });
    expect(
      document.head.querySelectorAll('script[type="application/ld+json"][data-seo]').length,
    ).toBe(0);
  });
});
