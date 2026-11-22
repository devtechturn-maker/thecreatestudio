import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Animated hero illustration: browser, phone, SEO chip, search and chat badges.
 * Every [data-pop] group is popped in by HomeComponent; the idle loops are plain CSS on inner
 * groups, so the two never fight over the same transform.
 */
@Component({
  selector: 'app-hero-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="art" viewBox="33 312 640 418" aria-hidden="true" focusable="false">
      <g data-pop><circle class="halo c-card" cx="360" cy="527" r="193" /></g>

      <g data-pop>
        <rect class="c-deep outline" x="79" y="388" width="410" height="278" rx="28" />
        <path class="outline" fill="none" d="M80 440h408" />
        <circle class="dot c-coral" cx="112" cy="414" r="8.5" />
        <circle class="dot c-yellow" cx="138" cy="414" r="8.5" />
        <circle class="dot c-mint" cx="164" cy="414" r="8.5" />
        <rect class="type c-cream" x="108" y="466" width="213" height="24" rx="12" />
        <rect class="type type--2 c-ice" x="108" y="502" width="148" height="17" rx="8.5" />
        <rect class="press c-yellow" x="108" y="535" width="105" height="36" rx="18" />
        <rect class="tile c-card" x="108" y="590" width="102" height="56" rx="15" />
        <rect class="tile c-card" x="223" y="590" width="101" height="56" rx="15" />
        <rect class="tile c-card" x="337" y="590" width="119" height="56" rx="15" />
      </g>

      <g data-pop>
        <g class="beat">
          <circle class="c-coral" cx="403" cy="516" r="49" />
          <path class="trend white-line" pathLength="1" d="M380 530l18-18 12 10 19-19" />
        </g>
      </g>

      <g data-pop>
        <g class="bob bob--phone">
          <rect class="c-deep phone" x="460" y="435" width="164" height="282" rx="34" />
          <rect class="c-yellow" x="517" y="450" width="49" height="11" rx="5.5" />
          <rect class="c-yellow" x="481" y="483" width="121" height="88" rx="20" />
          <rect class="type c-ink" x="494" y="499" width="66" height="11" rx="5.5" />
          <rect class="type type--2 c-cream" x="481" y="587" width="121" height="20" rx="10" />
          <rect class="type type--3 c-ice" x="481" y="620" width="82" height="20" rx="10" />
          <rect class="press press--late c-coral" x="481" y="656" width="121" height="36" rx="18" />
        </g>
      </g>

      <g data-pop>
        <g class="search">
          <circle class="c-yellow" cx="131" cy="349" r="33" />
          <circle class="ink-line" cx="126" cy="345" r="13" />
          <path class="ink-line" d="M136 355l12 12" />
        </g>
      </g>

      <g data-pop>
        <g class="bob bob--seo">
          <rect class="c-cream" x="524" y="329" width="128" height="55" rx="27.5" />
          <path class="trend coral-line" pathLength="1" d="M546 367l19-15 10 9 16-18" />
          <text class="seo" x="599" y="366">SEO</text>
        </g>
      </g>

      <g data-pop>
        <g class="bob bob--chat">
          <path class="c-coral" d="M43 591h75q20 0 20 20v18q0 20-20 20H84l-21 20v-20H43z" />
          <path class="trend white-line" pathLength="1" d="M66 621l11 11 19-19" />
        </g>
      </g>

      <g data-pop><path class="star c-yellow" d="M363.5 631l4 10 11 .7-8.5 6.8 3 10.5-9.500-6-9.500 6 3-10.500-8.500-6.800 11-.700z" /></g>
      <g data-pop><path class="diamond c-mint" d="M383 670l13 25-13 24-13-24z" /></g>
    </svg>
  `,
  styles: `
    :host { display: block; }
    .art { display: block; width: 100%; height: auto; overflow: visible; }
    .art g, .art path, .art rect, .art circle { transform-box: fill-box; transform-origin: center; }
    .c-card { fill: var(--teal-card); } .c-deep { fill: var(--teal-deep); } .c-cream { fill: var(--cream); }
    .c-ice { fill: var(--ice); } .c-yellow { fill: var(--yellow); } .c-coral { fill: var(--coral); }
    .c-mint { fill: var(--mint); } .c-ink { fill: var(--ink); }
    .outline { stroke: var(--cream); stroke-width: 4.5; }
    .phone { stroke: var(--yellow); stroke-width: 7; }
    .white-line, .coral-line, .ink-line { fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .white-line { stroke: #fff; stroke-width: 9; }
    .coral-line { stroke: var(--coral); stroke-width: 8; }
    .ink-line { stroke: var(--ink); stroke-width: 6.5; }
    .seo { font: 600 20px var(--f-display); fill: var(--teal-deep); }

    .halo { animation: breathe 7s ease-in-out infinite; }
    .dot { animation: blink 2.4s ease-in-out infinite; }
    .dot.c-yellow { animation-delay: .2s; } .dot.c-mint { animation-delay: .4s; }
    .art .type { transform-origin: left center; animation: type 6s var(--ease) infinite; }
    .type--2 { animation-delay: .35s !important; } .type--3 { animation-delay: .7s !important; }
    .press { animation: press 3s ease-in-out infinite; }
    .press--late { animation-delay: 1.5s; }
    .tile { animation: tile 2.7s ease-in-out infinite; }
    .tile:nth-of-type(6) { animation-delay: .3s; } .tile:nth-of-type(7) { animation-delay: .6s; }
    .beat { animation: breathe 2.6s ease-in-out infinite; }
    .trend { stroke-dasharray: 1 1; animation: draw 3.6s ease-in-out infinite; }
    .bob { animation: bob 4s ease-in-out infinite; }
    .bob--phone { animation-duration: 5s; }
    .bob--seo { animation-delay: -1.3s; } .bob--chat { animation-delay: -2.4s; }
    .search { animation: look 4.5s ease-in-out infinite; }
    .star { animation: twinkle 4s ease-in-out infinite; }
    .diamond { animation: flip 3.5s ease-in-out infinite; }

    @keyframes breathe { 50% { transform: scale(1.07); } }
    @keyframes blink { 50% { transform: scale(.65); } }
    @keyframes type { 0% { transform: scaleX(0); } 18%, 100% { transform: scaleX(1); } }
    @keyframes press { 12% { transform: scale(.88); } 24% { transform: scale(1); } }
    @keyframes tile { 50% { opacity: .55; } }
    @keyframes draw { 0% { stroke-dashoffset: 1; } 30%, 100% { stroke-dashoffset: 0; } }
    @keyframes bob { 50% { transform: translateY(-10px); } }
    @keyframes look { 25% { transform: translate(14px, 4px) rotate(8deg); } 65% { transform: translate(-4px, -8px) rotate(-10deg); } }
    @keyframes twinkle { 50% { transform: rotate(145deg) scale(1.35); } }
    @keyframes flip { 50% { transform: scaleX(.25) translateY(-5px); } }
  `,
})
export class HeroVisualComponent {}
