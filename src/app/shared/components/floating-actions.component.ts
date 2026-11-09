import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { IconComponent } from './icon.component';
import { whatsappLink } from '../../core/config/site.config';

/** Floating WhatsApp button (shown only when a number is configured) + back-to-top. */
@Component({
  selector: 'app-floating-actions',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (wa) {
      <a class="fab fab--wa" [href]="wa" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
        <app-icon name="whatsapp" [size]="26" />
      </a>
    }
    <button type="button" class="fab fab--top" [class.is-visible]="showTop()" (click)="toTop()" aria-label="Back to top"
            [attr.tabindex]="showTop() ? 0 : -1">
      <app-icon name="arrowUp" [size]="20" />
    </button>
  `,
  styles: `
    :host { position: fixed; right: clamp(1rem, 2.5vw, 1.75rem); bottom: clamp(1rem, 2.5vw, 1.75rem); z-index: 90; display: flex; flex-direction: column-reverse; gap: .75rem; align-items: center; }
    .fab { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 12px 30px rgba(0,0,0,.4); transition: transform .4s var(--ease), opacity .4s; }
    .fab:hover { transform: translateY(-4px) scale(1.05); }
    .fab--wa { background: #25d366; color: #fff; }
    .fab--top { width: 46px; height: 46px; background: var(--bg-3); border: 1px solid var(--line-strong); opacity: 0; transform: translateY(12px); pointer-events: none; }
    .fab--top.is-visible { opacity: 1; transform: none; pointer-events: auto; }
  `,
})
export class FloatingActionsComponent {
  protected readonly wa = whatsappLink();
  protected readonly showTop = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.showTop.set(window.scrollY > 800);
  }

  toTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}
