import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { MagneticDirective } from '../directives/magnetic.directive';
import { RevealDirective } from '../directives/reveal.directive';

/** Animated final call-to-action used across pages. */
@Component({
  selector: 'app-cta-section',
  imports: [RouterLink, IconComponent, MagneticDirective, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="cta" aria-labelledby="cta-title">
    <div class="cta__glow" aria-hidden="true"></div>
    <div class="container cta__inner">
      <p class="eyebrow" appReveal="fade">Start a project</p>
      <h2 id="cta-title" class="display-l" appReveal="mask">
        @for (l of lines(); track $index) { <span class="line"><span [class.grad-text]="$last">{{ l }}</span></span> }
      </h2>
      <p class="lead" appReveal>{{ text() }}</p>
      <div appReveal [revealDelay]="0.15">
        <a routerLink="/contact" class="btn btn--primary cta__btn" appMagnetic [strength]="0.4">{{ button() }} <app-icon name="arrow" [size]="18" /></a>
      </div>
    </div>
    <div class="cta__ring float" aria-hidden="true"></div>
    <div class="cta__ring cta__ring--2 float float--slow" aria-hidden="true"></div>
  </section>`,
  styles: `
    .cta { position: relative; overflow: hidden; padding-block: clamp(6rem, 14vw, 12rem); text-align: center; border-top: 1px solid var(--line); }
    .cta__inner { position: relative; z-index: 1; display: grid; justify-items: center; gap: 1.75rem; }
    .cta .lead { margin-inline: auto; }
    .cta__btn { --h: 64px; padding: 0 2.4rem; font-size: 1.05rem; }
    .cta__glow { position: absolute; left: 50%; top: 50%; width: min(900px, 120vw); aspect-ratio: 1; transform: translate(-50%, -50%); background: radial-gradient(closest-side, rgba(255,224,27,.28), rgba(19,128,140,.12) 50%, transparent 70%); animation: pulse 8s ease-in-out infinite; }
    .cta__ring { position: absolute; width: 180px; height: 180px; border-radius: 50%; border: 1px solid rgba(255,224,27,.35); left: 6%; top: 18%; }
    .cta__ring--2 { width: 110px; height: 110px; left: auto; right: 8%; top: auto; bottom: 14%; border-color: rgba(19,128,140,.45); }
    @keyframes pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.12); } }
  `,
})
export class CtaSectionComponent {
  readonly lines = input<string[]>(["LET'S CREATE", 'SOMETHING', 'EXTRAORDINARY.']);
  readonly text = input("Have an idea? Let's turn it into something people remember.");
  readonly button = input('Start Your Project');
}
