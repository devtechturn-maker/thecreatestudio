import { Injectable } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Central place for GSAP setup and motion preferences. */
@Injectable({ providedIn: 'root' })
export class MotionService {
  readonly gsap = gsap;
  readonly ScrollTrigger = ScrollTrigger;

  get reduced(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  get finePointer(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /** Resolves once the initial page loader has finished. */
  whenLoaded(): Promise<void> {
    return new Promise((resolve) => {
      if (!document.body.classList.contains('is-loading')) return resolve();
      const obs = new MutationObserver(() => {
        if (!document.body.classList.contains('is-loading')) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    });
  }

  refresh(): void {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
}
