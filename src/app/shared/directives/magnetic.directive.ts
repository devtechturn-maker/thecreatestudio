import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

/** Magnetic hover effect for buttons (desktop, fine pointers only). */
@Directive({ selector: '[appMagnetic]' })
export class MagneticDirective implements OnDestroy {
  readonly strength = input(0.3);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);
  private cleanup?: () => void;

  constructor() {
    afterNextRender(() => {
      if (this.motion.reduced || !this.motion.finePointer) return;
      const host = this.el.nativeElement as HTMLElement;
      const { gsap } = this.motion;
      const xTo = gsap.quickTo(host, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(host, 'y', { duration: 0.5, ease: 'power3.out' });
      const move = (e: MouseEvent) => {
        const r = host.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * this.strength());
        yTo((e.clientY - (r.top + r.height / 2)) * this.strength());
      };
      const leave = () => {
        xTo(0);
        yTo(0);
      };
      host.addEventListener('mousemove', move);
      host.addEventListener('mouseleave', leave);
      this.cleanup = () => {
        host.removeEventListener('mousemove', move);
        host.removeEventListener('mouseleave', leave);
        gsap.killTweensOf(host);
      };
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
