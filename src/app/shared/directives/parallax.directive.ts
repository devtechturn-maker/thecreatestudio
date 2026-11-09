import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

/** Scroll-linked parallax. Positive speed moves up faster than scroll. */
@Directive({ selector: '[appParallax]' })
export class ParallaxDirective implements OnDestroy {
  readonly appParallax = input<number | string>(0.2);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);
  private ctx?: gsap.Context;

  constructor() {
    afterNextRender(() => {
      if (this.motion.reduced) return;
      const host = this.el.nativeElement as HTMLElement;
      const speed = Number(this.appParallax()) || 0.2;
      this.ctx = this.motion.gsap.context(() => {
        this.motion.gsap.to(host, {
          yPercent: -speed * 100,
          ease: 'none',
          scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      }, host);
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
