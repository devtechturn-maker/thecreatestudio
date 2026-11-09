import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

/** Animated number counter that starts when scrolled into view. */
@Directive({ selector: '[appCounter]' })
export class CounterDirective implements OnDestroy {
  readonly appCounter = input.required<number>();
  readonly suffix = input('');
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);
  private ctx?: gsap.Context;

  constructor() {
    afterNextRender(() => {
      const host = this.el.nativeElement as HTMLElement;
      const target = this.appCounter();
      const render = (v: number) => (host.textContent = Math.round(v).toLocaleString('en-IN') + this.suffix());
      if (this.motion.reduced) { render(target); return; }
      render(0);
      const obj = { v: 0 };
      this.ctx = this.motion.gsap.context(() => {
        this.motion.gsap.to(obj, {
          v: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => render(obj.v),
          scrollTrigger: { trigger: host, start: 'top 90%', once: true },
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
