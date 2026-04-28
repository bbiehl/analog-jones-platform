import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { ORIGIN, SITE_NAME } from './origin.token';
import { breadcrumbList, organization, podcastSeries, website } from './seo.schemas';
import { SeoService } from './seo.service';

export interface RouteSeo {
  title: string;
  description: string;
  type?: 'website' | 'article';
  robots?: string;
  image?: string;
  titleSuffix?: boolean;
  includePodcastSeries?: boolean;
  breadcrumbs?: { name: string; path: string }[];
  dynamic?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);
  private readonly origin = inject(ORIGIN);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const seoData = this.findSeo(snapshot.root);

    if (!seoData) {
      // Unknown route — leave defaults from index.html.
      return;
    }

    if (seoData.dynamic) {
      // The route component will populate head itself (e.g., episode-detail).
      return;
    }

    const path = this.normalizePath(snapshot.url);
    const jsonLd: Record<string, unknown>[] = [organization(this.origin), website(this.origin)];

    if (seoData.includePodcastSeries) {
      jsonLd.push(podcastSeries(this.origin));
    }

    if (seoData.breadcrumbs?.length) {
      jsonLd.push(breadcrumbList(this.origin, seoData.breadcrumbs));
    }

    this.seo.setHead({
      title: seoData.title || SITE_NAME,
      description: seoData.description,
      path,
      image: seoData.image,
      type: seoData.type,
      robots: seoData.robots,
      titleSuffix: seoData.titleSuffix,
      jsonLd,
    });
  }

  private findSeo(route: ActivatedRouteSnapshot): RouteSeo | null {
    let current: ActivatedRouteSnapshot | null = route;
    let deepest: RouteSeo | null = null;
    while (current) {
      const seo = current.data?.['seo'] as RouteSeo | undefined;
      if (seo) deepest = seo;
      current = current.firstChild;
    }
    return deepest;
  }

  private normalizePath(url: string): string {
    const [pathOnly] = url.split('?');
    return pathOnly || '/';
  }
}
