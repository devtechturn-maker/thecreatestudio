import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { ServiceVisualComponent } from '../../shared/components/service-visual.component';
import { CtaSectionComponent } from '../../shared/components/cta-section.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { MARKETING_SERVICES } from '../../core/config/services.data';

/** Maps each marketing service to the matching option in the contact form dropdown. */
const CONTACT_MAP: Record<string, string> = {
  'social-media': 'Social Media Management', 'graphic-design': 'Graphic Designing', video: 'Reels & Video Editing',
  seo: 'SEO', geo: 'GEO', ads: 'Meta Ads', stories: 'Social Media Management', email: 'Email Marketing',
  branding: 'Branding', consultation: 'Complete Digital Marketing',
};

@Component({
  selector: 'app-digital-marketing',
  imports: [RouterLink, IconComponent, ServiceVisualComponent, CtaSectionComponent, RevealDirective, MagneticDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="page-hero" aria-labelledby="dm-title">
    <div class="blob blob--purple float" style="width:480px;height:480px;top:-10%;right:-10%" aria-hidden="true"></div>
    <div class="container">
      <p class="eyebrow" appReveal="fade">Division 01 · Digital Marketing</p>
      <h1 id="dm-title" class="display-l" appReveal="mask">
        <span class="line"><span>We grow brands</span></span>
        <span class="line"><span class="grad-text">through digital marketing.</span></span>
      </h1>
      <p class="lead" appReveal>Complete digital marketing solutions — from content that stops the scroll to campaigns that bring real customers. Strategy, creativity and data working together.</p>
      <div class="btn-row hero-btns" appReveal>
        <a routerLink="/contact" [queryParams]="{ service: 'Complete Digital Marketing' }" class="btn btn--primary" appMagnetic>Get a Marketing Plan <app-icon name="arrow" [size]="18" /></a>
        <a routerLink="/work" class="btn btn--ghost">See Creative Work</a>
      </div>
    </div>
  </section>

  <nav class="snav" aria-label="Digital marketing services">
    <div class="container snav__inner">
      @for (s of services; track s.id) {
        <a [href]="'#' + s.id" (click)="go($event, s.id)" [class.is-active]="active() === s.id">
          <span>{{ s.no }}</span>{{ short(s.title) }}
        </a>
      }
    </div>
  </nav>

  <section class="section" aria-label="Services">
    <div class="container svc-list">
      @for (s of services; track s.id; let i = $index) {
        <article class="svc" [id]="s.id" [class.svc--rev]="i % 2 === 1" appReveal>
          <app-service-visual class="svc__visual" [icon]="s.icon" [hue]="s.hue" [no]="s.no" [label]="s.title" />
          <div class="svc__body">
            <span class="svc__no">{{ s.no }} / 10</span>
            <h2 class="h3 svc__title">{{ s.title }}</h2>
            <p class="muted">{{ s.description }}</p>
            <h3 class="svc__sub">Key deliverables</h3>
            <ul class="svc__items">
              @for (it of s.items.slice(0, 4); track it) { <li><app-icon name="check" [size]="16" />{{ it }}</li> }
            </ul>
            @if (s.items.length > 4) {
              <div class="acc" [class.is-open]="open().has(s.id)" [id]="s.id + '-more'">
                <ul class="svc__items acc__inner">
                  @for (it of s.items.slice(4); track it) { <li><app-icon name="check" [size]="16" />{{ it }}</li> }
                </ul>
              </div>
            }
            <div class="svc__actions">
              @if (s.items.length > 4) {
                <button type="button" class="link-arrow" (click)="toggle(s.id)" [attr.aria-expanded]="open().has(s.id)" [attr.aria-controls]="s.id + '-more'">
                  {{ open().has(s.id) ? 'Show less' : 'Learn more' }}
                  <app-icon [name]="open().has(s.id) ? 'close' : 'plus'" [size]="16" />
                </button>
              }
              <a routerLink="/contact" [queryParams]="{ service: contactFor(s.id) }" class="btn btn--primary btn--sm">Contact Us <app-icon name="arrow" [size]="16" /></a>
            </div>
          </div>
        </article>
      }
    </div>
  </section>

  <app-cta-section [lines]="['READY TO', 'GROW YOUR', 'BRAND?']" text="Tell us about your brand and goals — we'll recommend the right mix of services." button="Start Your Project" />
  `,
  styles: `
    .hero-btns { margin-top: 2rem; }
    .snav { position: sticky; top: 0; z-index: 50; background: rgba(16,16,16,.85); backdrop-filter: blur(14px); border-block: 1px solid var(--line); }
    .snav__inner { display: flex; gap: .4rem; overflow-x: auto; padding-block: .8rem; scrollbar-width: none; }
    .snav__inner::-webkit-scrollbar { display: none; }
    .snav a { flex: none; display: inline-flex; gap: .45rem; padding: .55rem 1rem; border-radius: 999px; font-family: var(--f-alt); font-weight: 600; font-size: .85rem; color: var(--text-2); border: 1px solid transparent; transition: all .3s; }
    .snav a span { color: var(--purple); }
    .snav a:hover { color: #fff; }
    .snav a.is-active { color: #fff; border-color: rgba(168,85,247,.5); background: rgba(168,85,247,.12); }
    .svc-list { display: grid; gap: clamp(4rem, 9vw, 8rem); }
    .svc { display: grid; gap: clamp(1.5rem, 4vw, 4rem); align-items: center; scroll-margin-top: 90px; }
    @media (min-width: 900px) { .svc { grid-template-columns: 1fr 1fr; } .svc--rev .svc__visual { order: 2; } }
    .svc__body { display: grid; gap: 1rem; align-content: start; }
    .svc__no { font-family: var(--f-alt); font-weight: 800; font-size: .78rem; letter-spacing: .2em; color: var(--purple); }
    .svc__title { font-size: clamp(1.8rem, 3.4vw, 2.9rem); letter-spacing: -.035em; line-height: 1.05; }
    .svc__sub { font-family: var(--f-alt); font-size: .78rem; letter-spacing: .16em; text-transform: uppercase; color: var(--text-2); margin-top: .5rem; }
    .svc__items { display: grid; grid-template-columns: 1fr; gap: .55rem 1.25rem; }
    @media (min-width: 560px) { .svc__items { grid-template-columns: 1fr 1fr; } }
    .svc__items li { display: flex; gap: .55rem; align-items: center; font-size: .95rem; padding-bottom: .55rem; border-bottom: 1px solid var(--line); }
    .svc__items app-icon { color: var(--purple); flex: none; }
    .acc { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .6s var(--ease), opacity .4s; opacity: 0; }
    .acc.is-open { grid-template-rows: 1fr; opacity: 1; }
    .acc__inner { overflow: hidden; min-height: 0; }
    .svc__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; margin-top: .75rem; }
  `,
})
export class DigitalMarketingComponent {
  protected readonly services = MARKETING_SERVICES;
  protected readonly open = signal(new Set<string>());
  protected readonly active = signal(MARKETING_SERVICES[0].id);

  short(t: string): string {
    return t.replace(/\s*\(.*\)/, '').replace(' & Campaign Management', '').replace(' & Creative Content', '');
  }

  contactFor(id: string): string {
    return CONTACT_MAP[id] ?? 'Other';
  }

  toggle(id: string): void {
    this.open.update((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  go(e: Event, id: string): void {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    for (let i = this.services.length - 1; i >= 0; i--) {
      const el = document.getElementById(this.services[i].id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) {
        if (this.active() !== this.services[i].id) {
          this.active.set(this.services[i].id);
          document.querySelector(`.snav a[href="#${this.services[i].id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
        return;
      }
    }
  }
}
