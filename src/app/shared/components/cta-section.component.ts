import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MagneticDirective } from '../directives/magnetic.directive';
import { RevealDirective } from '../directives/reveal.directive';

/** Yellow closing call-to-action card used across pages. */
@Component({
  selector: 'app-cta-section',
  imports: [RouterLink, MagneticDirective, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="cta container" aria-labelledby="cta-title">
      <div class="cta__card" appReveal="scale">
        <span class="deco deco--ring" aria-hidden="true"></span>
        <span class="deco deco--diamond" aria-hidden="true"></span>
        <h2 id="cta-title" appReveal="mask">
          @for (l of lines(); track $index) {
            <span class="part"><span class="line"><span>{{ l }}</span></span></span>{{ ' ' }}
          }
        </h2>
        <p appReveal [revealDelay]="0.15">{{ text() }}</p>
        <a routerLink="/contact" class="btn cta__btn" appMagnetic [strength]="0.3">{{ button() }}</a>
      </div>
    </section>
  `,
  styles: `
    .cta { padding-block: clamp(2.25rem, 6vw, 5rem) clamp(2rem, 5vw, 4rem); }
    .cta__card { position: relative; overflow: hidden; display: grid; justify-items: center; gap: .75rem; padding: clamp(2.25rem, 7vw, 6rem) clamp(1rem, 5vw, 4rem); border-radius: clamp(30px, 4vw, 52px); background: var(--yellow); color: var(--ink); text-align: center; }
    h2, p, .cta__btn { position: relative; z-index: 1; }
    h2 { font-size: clamp(1.35rem, 4.4vw, 3.75rem); line-height: 1.1; }
    .part { display: inline-block; max-width: 100%; }
    p { max-width: 38ch; font-size: clamp(.9rem, 1.5vw, 1.2rem); line-height: 1.5; }
    .cta__btn { --h: 48px; margin-top: .5rem; background: var(--ink); color: var(--yellow); animation: pulse 2.4s ease-out infinite; }
    .cta__btn::before { background: var(--teal); }
    .cta__btn:focus-visible { outline-color: var(--ink); }
    .deco { position: absolute; pointer-events: none; }
    .deco--ring { width: 120px; aspect-ratio: 1; left: -55px; top: -55px; border: 14px solid var(--coral); border-radius: 50%; animation: breathe 5s ease-in-out infinite; }
    .deco--diamond { width: 22px; height: 38px; right: 18px; bottom: 20px; background: var(--teal); clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); animation: spin 5s ease-in-out infinite; }
    @media (max-width: 700px) { .deco--ring { width: 76px; left: -36px; top: -36px; border-width: 10px; } .deco--diamond { width: 16px; height: 28px; right: 12px; bottom: 14px; } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(26, 21, 1, .4); } 75%, 100% { box-shadow: 0 0 0 14px rgba(26, 21, 1, 0); } }
    @keyframes breathe { 50% { transform: scale(1.18); } }
    @keyframes spin { 50% { transform: rotateY(180deg); } }
  `,
})
export class CtaSectionComponent {
  readonly lines = input<string[]>(['Your idea.', 'Our creativity.']);
  readonly text = input('Message us today. We reply with a free plan within 24 hours.');
  readonly button = input('Start the conversation');
}
