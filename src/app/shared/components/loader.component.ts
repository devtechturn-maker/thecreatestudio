import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, afterNextRender, inject, output, signal } from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

/** Initial page loader: counter + wordmark reveal, then curtain lifts. */
@Component({
  selector: 'app-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (visible()) {
    <div class="loader" role="status" aria-live="polite">
      <span class="sr-only">Loading TheCreateStudio</span>
      <div class="loader__words" aria-hidden="true">
        <span class="w"><span>We</span></span>
        <span class="w"><span>Create.</span></span>
        <span class="w grad"><span>You Grow.</span></span>
      </div>
      <div class="loader__bar" aria-hidden="true"><span></span></div>
      <div class="loader__count" aria-hidden="true">{{ count() }}</div>
    </div>
  }`,
  styles: `
    .loader { position: fixed; inset: 0; z-index: 9999; background: var(--bg); display: grid; place-content: center; gap: 2rem; padding: 1.5rem; }
    .loader__words { display: flex; flex-wrap: wrap; justify-content: center; gap: .3em; font-family: var(--f-display); font-weight: 700; letter-spacing: -.05em; font-size: clamp(2.4rem, 8vw, 6rem); line-height: 1; }
    .w { overflow: hidden; display: inline-block; padding-bottom: .08em; }
    .w > span { display: inline-block; }
    .grad > span { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .loader__bar { width: min(320px, 70vw); height: 2px; background: var(--line); margin-inline: auto; overflow: hidden; border-radius: 2px; }
    .loader__bar span { display: block; height: 100%; background: var(--grad); transform-origin: left; transform: scaleX(0); }
    .loader__count { position: absolute; right: var(--gutter); bottom: 1.5rem; font-family: var(--f-display); font-size: clamp(3rem, 10vw, 8rem); font-weight: 700; color: rgba(255,255,255,.08); line-height: 1; }
  `,
})
export class LoaderComponent {
  readonly done = output<void>();
  protected readonly visible = signal(true);
  protected readonly count = signal(0);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    afterNextRender(() => {
      const el = this.host.nativeElement.querySelector('.loader') as HTMLElement;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.visible.set(false);
        this.doc.body.classList.remove('is-loading');
        this.done.emit();
      };
      // Safety net: never block the page for more than 4.5s.
      setTimeout(finish, 4500);
      let seen = false;
      try {
        seen = sessionStorage.getItem('tcs-loaded') === '1';
        sessionStorage.setItem('tcs-loaded', '1');
      } catch { /* storage unavailable */ }
      if (this.motion.reduced || !el || seen) {
        this.count.set(100);
        setTimeout(finish, 150); return;
      }
      const { gsap } = this.motion;
      const c = { v: 0 };
      gsap.timeline({ onComplete: finish })
        .from(el.querySelectorAll('.w > span'), { yPercent: 110, duration: 0.8, ease: 'power4.out', stagger: 0.12 })
        .to(el.querySelector('.loader__bar span'), { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.2)
        .to(c, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => this.count.set(Math.round(c.v)) }, 0.2)
        .to(el.querySelectorAll('.w > span'), { yPercent: -110, duration: 0.5, ease: 'power3.in', stagger: 0.05 }, '+=0.15')
        .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'power4.inOut' }, '-=0.2');

    });
  }
}
