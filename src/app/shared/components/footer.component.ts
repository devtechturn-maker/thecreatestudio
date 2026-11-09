import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandComponent } from './brand.component';
import { IconComponent } from './icon.component';
import { SITE, whatsappLink } from '../../core/config/site.config';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, BrandComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <footer class="footer">
    <div class="container">
      <div class="footer__top">
        <div class="footer__about">
          <a routerLink="/" aria-label="TheCreateStudio home"><app-brand /></a>
          <p class="muted">{{ site.description }}</p>
          <p class="footer__tag">{{ site.footerTagline }}</p>
        </div>

        <nav aria-label="Quick links">
          <h2 class="footer__h">Quick Links</h2>
          <ul>
            <li><a routerLink="/">Home</a></li>
            <li><a routerLink="/about">About Us</a></li>
            <li><a routerLink="/work">Our Work</a></li>
            <li><a routerLink="/contact">Contact</a></li>
            <li><a routerLink="/privacy-policy">Privacy Policy</a></li>
            <li><a routerLink="/terms">Terms &amp; Conditions</a></li>
          </ul>
        </nav>

        <nav aria-label="Digital marketing services">
          <h2 class="footer__h">Digital Marketing</h2>
          <ul>
            @for (s of marketing; track s.id) {
              <li><a routerLink="/digital-marketing" [fragment]="s.id">{{ s.label }}</a></li>
            }
          </ul>
        </nav>

        <nav aria-label="Development services">
          <h2 class="footer__h">Development</h2>
          <ul>
            @for (s of dev; track s.id) {
              <li><a routerLink="/development" [fragment]="s.id">{{ s.label }}</a></li>
            }
          </ul>
        </nav>

        <div>
          <h2 class="footer__h">Get in Touch</h2>
          <ul class="footer__contact">
            @if (site.contact.email) { <li><a [href]="'mailto:' + site.contact.email"><app-icon name="mail" [size]="18" />{{ site.contact.email }}</a></li> }
            @if (site.contact.phone) { <li><a [href]="'tel:' + site.contact.phone.replace(' ', '')"><app-icon name="phone" [size]="18" />{{ site.contact.phone }}</a></li> }
            @if (site.contact.address) { <li><span><app-icon name="location" [size]="18" />{{ site.contact.address }}</span></li> }
            <li><a routerLink="/contact"><app-icon name="arrowUpRight" [size]="18" />Send us an inquiry</a></li>
          </ul>
          @if (socials.length) {
            <ul class="footer__social">
              @for (s of socials; track s.name) {
                <li><a [href]="s.url" target="_blank" rel="noopener noreferrer" [attr.aria-label]="s.label"><app-icon [name]="s.name" [size]="20" /></a></li>
              }
            </ul>
          }
        </div>
      </div>

      <div class="footer__big" aria-hidden="true">WE CREATE. YOU GROW.</div>

      <div class="footer__bottom">
        <p>© {{ year }} TheCreateStudio. All rights reserved.</p>
        <p><a routerLink="/privacy-policy">Privacy</a> · <a routerLink="/terms">Terms</a></p>
      </div>
    </div>
  </footer>`,
  styles: `
    .footer { background: var(--bg-2); border-top: 1px solid var(--line); padding-top: clamp(4rem, 8vw, 7rem); overflow: hidden; }
    .footer__top { display: grid; gap: 2.5rem; grid-template-columns: 1fr 1fr; }
    .footer__about { grid-column: 1 / -1; display: grid; gap: 1.25rem; max-width: 420px; }
    .footer__tag { font-family: var(--f-display); font-weight: 600; font-size: 1.1rem; }
    .footer__h { font-family: var(--f-alt); font-size: .78rem; letter-spacing: .16em; text-transform: uppercase; color: var(--text-2); margin-bottom: 1.25rem; font-weight: 700; }
    ul { display: grid; gap: .65rem; }
    a { color: #e4e4e7; font-size: .94rem; transition: color .3s; }
    a:hover { color: var(--purple); }
    .footer__contact a, .footer__contact span { display: inline-flex; gap: .6rem; align-items: flex-start; font-size: .94rem; color: #e4e4e7; word-break: break-word; }
    .footer__social { display: flex; gap: .6rem; margin-top: 1.5rem; }
    .footer__social a { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line-strong); display: grid; place-items: center; transition: all .4s var(--ease); }
    .footer__social a:hover { background: var(--grad); border-color: transparent; color: #fff; transform: translateY(-3px); }
    .footer__big { font-family: var(--f-display); font-weight: 700; letter-spacing: -.05em; font-size: clamp(2.6rem, 10.5vw, 10rem); line-height: .9; margin: clamp(3rem, 7vw, 6rem) 0 1.5rem; white-space: nowrap; background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,0)); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .footer__bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; padding: 1.5rem 0 2rem; border-top: 1px solid var(--line); color: var(--text-2); font-size: .85rem; }
    .footer__bottom a { color: var(--text-2); font-size: .85rem; }
    @media (min-width: 900px) { .footer__top { grid-template-columns: 1.6fr 1fr 1fr 1fr 1.3fr; } .footer__about { grid-column: auto; } }
  `,
})
export class FooterComponent {
  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();
  protected readonly marketing = [
    { id: 'social-media', label: 'Social Media Management' },
    { id: 'graphic-design', label: 'Graphic Designing' },
    { id: 'video', label: 'Reels & Video Editing' },
    { id: 'seo', label: 'SEO & GEO' },
    { id: 'ads', label: 'Paid Advertising' },
    { id: 'branding', label: 'Brand Strategy' },
  ];
  protected readonly dev = [
    { id: 'websites', label: 'Website Development' },
    { id: 'web-apps', label: 'Web Applications' },
    { id: 'mobile', label: 'Mobile Apps' },
    { id: 'uiux', label: 'UI/UX Design' },
  ];
  protected readonly socials = [
    { name: 'instagram', label: 'Instagram', url: SITE.social.instagram },
    { name: 'linkedin', label: 'LinkedIn', url: SITE.social.linkedin },
    { name: 'facebook', label: 'Facebook', url: SITE.social.facebook },
    { name: 'whatsapp', label: 'WhatsApp', url: whatsappLink() },
  ].filter((s) => !!s.url);
}
