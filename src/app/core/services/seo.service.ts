import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { SITE } from '../config/site.config';

export interface SeoData {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly doc = inject(DOCUMENT);

  update(data: SeoData, path: string): void {
    const fullTitle = data.title.includes(SITE.name) ? data.title : `${data.title} | ${SITE.name}`;
    const url = environment.siteUrl.replace(/\/$/, '') + (path === '/' ? '/' : path.split('?')[0].split('#')[0]);
    const image = environment.siteUrl.replace(/\/$/, '') + '/' + (data.image ?? 'assets/images/og-image.svg');

    this.title.setTitle(fullTitle);
    const tags: [string, string, 'name' | 'property'][] = [
      ['description', data.description, 'name'],
      ['robots', data.noindex ? 'noindex, follow' : 'index, follow', 'name'],
      ['og:title', fullTitle, 'property'],
      ['og:description', data.description, 'property'],
      ['og:type', 'website', 'property'],
      ['og:url', url, 'property'],
      ['og:image', image, 'property'],
      ['og:site_name', SITE.name, 'property'],
      ['twitter:card', 'summary_large_image', 'name'],
      ['twitter:title', fullTitle, 'name'],
      ['twitter:description', data.description, 'name'],
      ['twitter:image', image, 'name'],
    ];
    for (const [key, content, attr] of tags) {
      this.meta.updateTag({ [attr]: key, content } as Record<string, string>);
    }

    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = url;
  }

  /** Organization structured data (no invented contact details). */
  addOrganizationSchema(): void {
    const sameAs = Object.values(SITE.social).filter(Boolean);
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      url: environment.siteUrl,
      description: SITE.description,
      slogan: SITE.tagline,
    };
    if (sameAs.length) schema['sameAs'] = sameAs;
    if (SITE.contact.email) schema['email'] = SITE.contact.email;
    if (SITE.contact.phone) schema['telephone'] = SITE.contact.phone;
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    this.doc.head.appendChild(script);
    // LocalBusiness schema is intentionally omitted until a real address is configured.
  }
}
