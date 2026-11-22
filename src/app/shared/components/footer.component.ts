import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { SITE, whatsappLink } from '../../core/config/site.config';

/** Minimal centred footer. Contact details and socials appear once set in site.config.ts. */
@Component({
  selector: 'app-footer',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer container">
      <nav aria-label="Footer">
        <ul class="row">
          @for (l of links; track l.path) { <li><a [routerLink]="l.path">{{ l.label }}</a></li> }
        </ul>
      </nav>

      @if (site.contact.email || site.contact.phone || site.contact.address) {
        <ul class="row">
          @if (site.contact.email) { <li><a [href]="'mailto:' + site.contact.email">{{ site.contact.email }}</a></li> }
          @if (site.contact.phone) { <li><a [href]="'tel:' + site.contact.phone.replace(' ', '')">{{ site.contact.phone }}</a></li> }
          @if (site.contact.address) { <li>{{ site.contact.address }}</li> }
        </ul>
      }

      @if (socials.length) {
        <ul class="row">
          @for (s of socials; track s.name) {
            <li><a class="social" [href]="s.url" target="_blank" rel="noopener noreferrer" [attr.aria-label]="s.label"><app-icon [name]="s.name" [size]="20" /></a></li>
          }
        </ul>
      }

      <p>© {{ year }} TheCreateStudio.in. Digital marketing, website and mobile app design.</p>
    </footer>
  `,
  styles: `
    .footer { display: grid; justify-items: center; gap: 1rem; padding-top: 1rem; padding-bottom: max(5rem, env(safe-area-inset-bottom)); text-align: center; color: var(--ice); font-size: clamp(.75rem, 1.1vw, .9rem); }
    .row { display: flex; flex-wrap: wrap; justify-content: center; gap: .1rem 1rem; }
    .row a { display: inline-flex; align-items: center; min-height: 32px; transition: color .3s; }
    .row a:hover { color: var(--yellow); }
    .social { width: 44px; height: 44px; justify-content: center; border: 1.5px solid var(--line-strong); border-radius: 50%; }
    p { max-width: 36em; text-wrap: balance; }
  `,
})
export class FooterComponent {
  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();
  protected readonly links = [
    { path: '/about', label: 'About' },
    { path: '/digital-marketing', label: 'Digital marketing' },
    { path: '/development', label: 'Websites & apps' },
    { path: '/work', label: 'Our work' },
    { path: '/contact', label: 'Contact' },
    { path: '/privacy-policy', label: 'Privacy' },
    { path: '/terms', label: 'Terms' },
  ];
  protected readonly socials = [
    { name: 'instagram', label: 'Instagram', url: SITE.social.instagram },
    { name: 'linkedin', label: 'LinkedIn', url: SITE.social.linkedin },
    { name: 'facebook', label: 'Facebook', url: SITE.social.facebook },
    { name: 'whatsapp', label: 'WhatsApp', url: whatsappLink() },
  ].filter((s) => !!s.url);
}
