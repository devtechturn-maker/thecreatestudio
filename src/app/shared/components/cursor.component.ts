import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, OnDestroy, afterNextRender, inject, signal } from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

/** Custom cursor for desktop (fine pointer) only. Grows over interactive elements. */
@Component({
  selector: 'app-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (enabled()) { <div class="dot" aria-hidden="true"></div><div class="ring" aria-hidden="true"><span>View</span></div> }`,
  styles: `
    :host { pointer-events: none; position: fixed; inset: 0; z-index: 10000; }
    .dot, .ring { position: fixed; top: 0; left: 0; border-radius: 50%; pointer-events: none; will-change: transform; }
    .dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; background: #fff; mix-blend-mode: difference; }
    .ring { width: 40px; height: 40px; margin: -20px 0 0 -20px; border: 1px solid rgba(255,255,255,.5); display: grid; place-items: center; transition: width .35s var(--ease), height .35s var(--ease), margin .35s var(--ease), background .35s, border-color .35s; }
    .ring span { font-family: var(--f-alt); font-weight: 700; font-size: .75rem; opacity: 0; transition: opacity .3s; }
    :host-context(.cursor-hover) .ring { width: 64px; height: 64px; margin: -32px 0 0 -32px; border-color: var(--purple); background: rgba(255,224,27,.12); }
    :host-context(.cursor-view) .ring { width: 92px; height: 92px; margin: -46px 0 0 -46px; background: var(--purple); color: var(--on-accent); border-color: transparent; }
    :host-context(.cursor-view) .ring span { opacity: 1; }
  `,
})
export class CursorComponent implements OnDestroy {
  protected readonly enabled = signal(false);
  private readonly motion = inject(MotionService);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private cleanup?: () => void;

  constructor() {
    afterNextRender(() => {
      if (!this.motion.finePointer || this.motion.reduced) return;
      this.enabled.set(true);
      setTimeout(() => this.bind());
    });
  }

  private bind(): void {
    const root = this.host.nativeElement as HTMLElement;
    const dot = root.querySelector('.dot');
    const ring = root.querySelector('.ring');
    if (!dot || !ring) return;
    const { gsap } = this.motion;
    const dx = gsap.quickTo(dot, 'x', { duration: 0.1 }), dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    const html = this.doc.documentElement;
    const move = (e: PointerEvent) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); };
    const over = (e: Event) => {
      const t = e.target as HTMLElement;
      html.classList.toggle('cursor-view', !!t.closest('[data-cursor="view"]'));
      html.classList.toggle('cursor-hover', !!t.closest('a, button, input, select, textarea, [role="button"]'));
    };
    this.doc.addEventListener('pointermove', move, { passive: true });
    this.doc.addEventListener('pointerover', over, { passive: true });
    this.cleanup = () => {
      this.doc.removeEventListener('pointermove', move);
      this.doc.removeEventListener('pointerover', over);
      html.classList.remove('cursor-view', 'cursor-hover');
    };
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
