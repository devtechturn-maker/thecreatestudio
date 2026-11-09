import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { FooterComponent } from '../shared/components/footer.component';
import { FloatingActionsComponent } from '../shared/components/floating-actions.component';
import { MotionService } from '../core/services/motion.service';

/** Site shell: navbar, animated route outlet (page transitions), footer, floating actions. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, FloatingActionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main" (click)="skip($event)">Skip to content</a>
    <app-navbar />
    <div class="curtain" #curtain aria-hidden="true"></div>
    <main id="main" tabindex="-1" #main>
      <router-outlet (activate)="onActivate()" />
    </main>
    <app-footer />
    <app-floating-actions />
  `,
  styles: `
    main { display: block; outline: none; min-height: 60vh; }
    .curtain { position: fixed; inset: 0; z-index: 95; background: linear-gradient(120deg, #1a1028, #12112a); transform: scaleY(0); transform-origin: bottom; pointer-events: none; }
  `,
})
export class MainLayoutComponent {
  private readonly motion = inject(MotionService);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly curtain = viewChild.required<ElementRef<HTMLElement>>('curtain');
  private first = true;

  onActivate(): void {
    const { gsap, ScrollTrigger } = this.motion;
    if (this.first || this.motion.reduced) {
      this.first = false;
      this.motion.refresh();
      return;
    }
    // Page transition: curtain sweeps away, new page content eases in.
    const curtain = this.curtain().nativeElement;
    gsap.timeline({ onComplete: () => ScrollTrigger.refresh() })
      .set(curtain, { scaleY: 1, transformOrigin: 'top' })
      .to(curtain, { scaleY: 0, duration: 0.7, ease: 'power4.inOut' })
      .from(this.main().nativeElement, { y: 30, autoAlpha: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' }, 0.25);
  }

  skip(e: Event): void {
    e.preventDefault();
    this.main().nativeElement.focus();
  }
}
