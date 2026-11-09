import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

export type RevealVariant = 'up' | 'fade' | 'mask' | 'stagger' | 'image' | 'scale';

/**
 * Scroll-triggered reveal. Usage:
 *   <div appReveal>…</div>
 *   <ul appReveal="stagger"><li data-reveal-item>…</li></ul>
 *   <h2 appReveal="mask"><span class="line"><span>Text</span></span></h2>
 * All tweens & ScrollTriggers are reverted when the host is destroyed.
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnDestroy {
  readonly appReveal = input<RevealVariant | ''>('');
  readonly revealDelay = input(0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);
  private ctx?: gsap.Context;

  constructor() {
    afterNextRender(() => this.init());
  }

  private init(): void {
    const host = this.el.nativeElement as HTMLElement;
    if (this.motion.reduced) return;
    const { gsap } = this.motion;
    const variant = this.appReveal() || 'up';
    const delay = this.revealDelay();
    const trigger = { trigger: host, start: 'top 85%', once: true };

    this.ctx = gsap.context(() => {
      switch (variant) {
        case 'stagger': {
          const items = host.querySelectorAll('[data-reveal-item]');
          gsap.from(items, { y: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay, scrollTrigger: trigger });
          break;
        }
        case 'mask': {
          const lines = host.querySelectorAll('.line > span');
          gsap.from(lines.length ? lines : host, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.1, delay, scrollTrigger: trigger });
          break;
        }
        case 'image':
          gsap.fromTo(host, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut', delay, scrollTrigger: trigger });
          break;
        case 'scale':
          gsap.from(host, { scale: 0.92, autoAlpha: 0, duration: 1, ease: 'power3.out', delay, scrollTrigger: trigger });
          break;
        case 'fade':
          gsap.from(host, { autoAlpha: 0, duration: 1, delay, scrollTrigger: trigger });
          break;
        default:
          gsap.from(host, { y: 50, autoAlpha: 0, duration: 0.9, ease: 'power3.out', delay, scrollTrigger: trigger });
      }
    }, host);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
