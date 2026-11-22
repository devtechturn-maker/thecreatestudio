import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * TheCreateStudio.in logo, traced as SVG from the brand artwork so it stays sharp and can animate:
 * burst lines flick on load and on hover, and the play button in the "C" nudges forward.
 */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="logo" [class.logo--lg]="large()" viewBox="312 417 572 202" role="img" aria-label="TheCreateStudio.in">
      <g class="yellow burst">
        <path d="M316 470q-2-9 6-8l40 21-2 4-42-13z" />
        <path d="M332 434q1-7 9-5l23 38-4 3-27-31z" />
        <path d="M369 425q4-6 9-2l4 46h-4z" />
      </g>
      <path class="yellow" d="M396 477h124q22 0 22 22v67q0 22-22 22h-8q4 18 29 28-40 0-56-28h-89q-23 0-23-22v-67q0-22 23-22z" />
      <g class="teal">
        <path d="M380 503h47v14h-16v48h-15v-48h-16z" />
        <path d="M434 503h15v24h26v-24h15v62h-15v-24h-26v24h-15z" />
        <path d="M500 503h34v13h-20v11h18v13h-18v12h20v13h-34z" />
      </g>
      <g class="cream">
        <path d="M616 526h-15a17 17 0 1 0 0 20h15a31.5 31.5 0 1 1 0-20z" />
        <path fill-rule="evenodd" d="M625 505h25c30 0 26 34 9 37l15 24h-17l-13-21h-5v21h-14zm14 12v16h10c13 0 13-16 0-16z" />
        <path d="M681 505h36v12h-22v12h19v12h-19v13h22v12h-36z" />
        <path d="M723 566l22-61h16l22 61h-15l-15-43-15 43z" />
        <path d="M787 505h47v13h-16v48h-15v-48h-16z" />
        <path d="M843 505h36v12h-22v12h19v12h-19v13h22v12h-36z" />
      </g>
      <path class="yellow play" d="M592 526l19 10-19 10z" />
      <path class="yellow" d="M754 536l13 30h-26z" />
      <g class="studio">
        <path d="M594 593.5h-24c-5 0-5 7 0 7h19c5 0 5 7 0 7h-24" />
        <path d="M610 593.5h28m-14 0v15" />
        <path d="M654 592v10q0 5.5 6 5.5h15q6 0 6-5.5v-10" />
        <path d="M699 593.5h17q9 0 9 7t-9 7h-17z" />
        <path d="M742 592v17" />
        <path d="M764 593.5h18q6 0 6 7t-6 7h-18q-6 0-6-7t6-7z" />
        <path d="M804 607h4" />
        <path d="M824 592v17" />
        <path d="M840 609v-15.5h22q7 0 7 7v8.5" />
      </g>
    </svg>
  `,
  styles: `
    :host { display: inline-block; line-height: 0; }
    .logo { display: block; width: clamp(114px, 12vw, 152px); height: auto; overflow: visible; }
    .logo--lg { width: min(440px, 72vw); }
    .yellow { fill: var(--yellow); }
    .teal { fill: var(--teal); }
    .cream { fill: #fff; }
    .studio { fill: none; stroke: var(--yellow); stroke-width: 4; }
    .burst path, .play { transform-box: fill-box; transform-origin: 100% 100%; }
    .burst path { animation: flick .7s var(--ease) 3 backwards; }
    .burst path:nth-child(2) { animation-delay: .1s; }
    .burst path:nth-child(3) { animation-delay: .2s; }
    .play { transition: transform .4s var(--ease); }
    :host(:hover) .burst path { animation: flick-hover .6s var(--ease) infinite alternate; }
    :host(:hover) .play { transform: translateX(7px); }
    @keyframes flick { 0% { transform: scale(.35); opacity: 0; } 60% { transform: scale(1.18); opacity: 1; } 100% { transform: scale(1); } }
    @keyframes flick-hover { to { transform: scale(1.22); } }
  `,
})
export class BrandComponent {
  readonly large = input(false);
}
