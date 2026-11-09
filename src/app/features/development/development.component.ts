import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../shared/components/icon.component';
import { CtaSectionComponent } from '../../shared/components/cta-section.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { ParallaxDirective } from '../../shared/directives/parallax.directive';
import { DEV_PROCESS, DEV_SERVICES, TECH_STACK } from '../../core/config/services.data';

const CONTACT_MAP: Record<string, string> = {
  websites: 'Website Development', 'web-apps': 'Web Application Development', mobile: 'Mobile App Development', uiux: 'UI/UX Design',
};

@Component({
  selector: 'app-development',
  imports: [RouterLink, IconComponent, CtaSectionComponent, RevealDirective, MagneticDirective, ParallaxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="page-hero" aria-labelledby="dev-title">
    <div class="blob blob--blue float" style="width:520px;height:520px;top:-15%;left:-12%" aria-hidden="true"></div>
    <div class="container hero-grid">
      <div>
        <p class="eyebrow" appReveal="fade">Division 02 · Development</p>
        <h1 id="dev-title" class="display-l" appReveal="mask">
          <span class="line"><span>We build powerful</span></span>
          <span class="line"><span class="grad-text">websites &amp; apps.</span></span>
        </h1>
        <p class="lead" appReveal>Modern websites, web applications and mobile apps engineered for speed, security and growth — designed with care, built to scale.</p>
        <div class="btn-row hero-btns" appReveal>
          <a routerLink="/contact" [queryParams]="{ service: 'Website Development' }" class="btn btn--primary" appMagnetic>Discuss Your Project <app-icon name="arrow" [size]="18" /></a>
          <a routerLink="/work" class="btn btn--ghost">See Our Work</a>
        </div>
      </div>
      <div class="code" appReveal="scale" aria-hidden="true" appParallax="0.08">
        <div class="code__bar"><i></i><i></i><i></i><span>app.component.ts</span></div>
        <pre><code><span class="k">export class</span> <span class="t">YourProduct</span> {{ '{' }}
  speed   = <span class="s">'blazing'</span>;
  design  = <span class="s">'premium'</span>;
  devices = [<span class="s">'web'</span>, <span class="s">'android'</span>, <span class="s">'ios'</span>];

  <span class="f">launch</span>() {{ '{' }}
    <span class="k">return</span> <span class="t">growth</span>.<span class="f">start</span>();
  {{ '}' }}
{{ '}' }}</code></pre>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="dev-services">
    <div class="container">
      <h2 id="dev-services" class="sr-only">Development services</h2>
      <div class="tabs" role="tablist" aria-label="Development service categories">
        @for (g of groups; track g.id; let i = $index) {
          <button type="button" role="tab" [id]="'tab-' + g.id" [attr.aria-selected]="tab() === i" [attr.aria-controls]="'panel-' + g.id"
                  [attr.tabindex]="tab() === i ? 0 : -1" [class.is-active]="tab() === i" (click)="tab.set(i)" (keydown)="onTabKey($event)">
            <app-icon [name]="g.icon" [size]="20" /> {{ g.title }}
          </button>
        }
      </div>

      @for (g of groups; track g.id; let i = $index) {
        <div class="panel" role="tabpanel" [id]="'panel-' + g.id" [attr.aria-labelledby]="'tab-' + g.id" [hidden]="tab() !== i">
          <span [id]="g.id" class="anchor"></span>
          <div class="panel__head">
            <span class="icon-badge"><app-icon [name]="g.icon" /></span>
            <div>
              <h3 class="h2">{{ g.title }}</h3>
              <p class="lead">{{ g.description }}</p>
            </div>
          </div>
          <ul class="panel__grid">
            @for (it of g.items; track it; let j = $index) {
              <li class="tile" [style.animation-delay]="j * 50 + 'ms'">
                <span class="tile__no">{{ (j + 1).toString().padStart(2, '0') }}</span>
                <span class="tile__name">{{ it }}</span>
                <app-icon name="arrowUpRight" [size]="18" />
              </li>
            }
          </ul>
          <a routerLink="/contact" [queryParams]="{ service: contactFor(g.id) }" class="btn btn--primary btn--sm">Contact Us about {{ g.title }} <app-icon name="arrow" [size]="16" /></a>
        </div>
      }
    </div>
  </section>

  <section class="section section--alt" aria-labelledby="stack-title">
    <div class="container">
      <div class="section-head section-head--split">
        <div>
          <p class="eyebrow" appReveal="fade">Technology stack</p>
          <h2 id="stack-title" class="h2" appReveal="mask"><span class="line"><span>Tools we build with.</span></span></h2>
        </div>
        <p class="lead" appReveal>Proven, modern technologies chosen for each project's needs — not trends.</p>
      </div>
      <div class="stack">
        @for (s of stack; track s.group) {
          <div class="stack__group" appReveal="stagger">
            <h3 class="stack__label" data-reveal-item>{{ s.group }}</h3>
            <ul class="stack__items">
              @for (t of s.items; track t) { <li class="badge" data-reveal-item><span class="badge__dot" aria-hidden="true"></span>{{ t }}</li> }
            </ul>
          </div>
        }
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="dproc-title">
    <div class="container">
      <div class="section-head section-head--split">
        <div>
          <p class="eyebrow" appReveal="fade">Development process</p>
          <h2 id="dproc-title" class="h2" appReveal="mask"><span class="line"><span>How we ship</span></span><span class="line"><span class="grad-text">great products.</span></span></h2>
        </div>
        <p class="lead" appReveal>Select a step to see what happens at each stage.</p>
      </div>
      <div class="proc">
        <ol class="proc__list">
          @for (p of process; track p.title; let i = $index) {
            <li>
              <button type="button" [class.is-active]="step() === i" (click)="step.set(i)" [attr.aria-pressed]="step() === i" (mouseenter)="step.set(i)">
                <span class="proc__n">0{{ i + 1 }}</span><span class="proc__t">{{ p.title }}</span>
              </button>
            </li>
          }
        </ol>
        <div class="proc__detail" aria-live="polite">
          @for (p of process; track p.title; let i = $index) {
            @if (step() === i) {
              <div class="proc__card">
                <span class="proc__big grad-text">0{{ i + 1 }}</span>
                <h3 class="h3">{{ p.title }}</h3>
                <p class="muted">{{ p.text }}</p>
                <div class="proc__bar"><span [style.width.%]="((i + 1) / process.length) * 100"></span></div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  </section>

  <app-cta-section [lines]="['HAVE AN IDEA?', 'LET\\'S BUILD', 'IT TOGETHER.']" text="Share your requirements and we'll suggest the right technology, timeline and plan." button="Start Your Project" />
  `,
  styles: `
    .hero-btns { margin-top: 2rem; }
    .hero-grid { display: grid; gap: 3rem; align-items: center; }
    @media (min-width: 1100px) { .hero-grid { grid-template-columns: 1.3fr 1fr; } }
    .code { background: #141416; border: 1px solid var(--line-strong); border-radius: 20px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,.45); }
    .code__bar { display: flex; gap: 6px; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); }
    .code__bar i { width: 10px; height: 10px; border-radius: 50%; background: #3f3f46; }
    .code__bar span { margin-left: 8px; font-size: .75rem; color: var(--text-2); }
    pre { margin: 0; padding: 1.5rem; font-size: clamp(.78rem, 1.4vw, .95rem); line-height: 1.8; overflow-x: auto; color: #e4e4e7; }
    .k { color: #c084fc; } .t { color: #818cf8; } .s { color: #86efac; } .f { color: #fcd34d; }
    .tabs { display: flex; gap: .5rem; overflow-x: auto; padding-bottom: .5rem; margin-bottom: 3rem; scrollbar-width: none; }
    .tabs button { flex: none; display: inline-flex; align-items: center; gap: .55rem; padding: .9rem 1.3rem; border-radius: 999px; border: 1px solid var(--line-strong); font-family: var(--f-alt); font-weight: 700; font-size: .92rem; color: var(--text-2); transition: all .35s var(--ease); }
    .tabs button:hover { color: #fff; }
    .tabs button.is-active { background: var(--grad); color: #fff; border-color: transparent; }
    .panel { display: grid; gap: 2.5rem; animation: in .6s var(--ease); }
    .anchor { position: absolute; margin-top: -120px; }
    .panel__head { display: grid; gap: 1.5rem; }
    @media (min-width: 900px) { .panel__head { grid-template-columns: auto 1fr; align-items: start; } }
    .panel__head .lead { margin-top: 1rem; }
    .panel__grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .panel__grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1100px) { .panel__grid { grid-template-columns: repeat(4, 1fr); } }
    .tile { display: grid; gap: 2.5rem; padding: 1.5rem; border-radius: 18px; border: 1px solid var(--line); background: var(--bg-2); position: relative; animation: in .6s var(--ease) both; transition: border-color .4s, transform .4s var(--ease), background .4s; }
    .tile:hover { border-color: rgba(168,85,247,.5); transform: translateY(-4px); background: linear-gradient(160deg, rgba(168,85,247,.12), var(--bg-2)); }
    .tile app-icon { position: absolute; top: 1.4rem; right: 1.4rem; color: var(--text-2); transition: transform .4s var(--ease), color .4s; }
    .tile:hover app-icon { color: var(--purple); transform: translate(3px, -3px); }
    .tile__no { font-family: var(--f-display); color: var(--purple); font-size: .85rem; }
    .tile__name { font-family: var(--f-display); font-weight: 600; font-size: 1.2rem; letter-spacing: -.02em; }
    .panel > .btn { justify-self: start; }
    @keyframes in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    .stack { display: grid; gap: 2rem; }
    .stack__group { display: grid; gap: 1rem; padding-bottom: 2rem; border-bottom: 1px solid var(--line); }
    @media (min-width: 900px) { .stack__group { grid-template-columns: 220px 1fr; align-items: center; } }
    .stack__label { font-family: var(--f-display); font-size: 1.6rem; letter-spacing: -.03em; }
    .stack__items { display: flex; flex-wrap: wrap; gap: .75rem; }
    .badge { display: inline-flex; align-items: center; gap: .6rem; padding: .8rem 1.25rem; border-radius: 14px; background: var(--bg); border: 1px solid var(--line-strong); font-family: var(--f-alt); font-weight: 700; transition: all .35s var(--ease); }
    .badge:hover { border-color: var(--purple); transform: translateY(-3px); box-shadow: 0 12px 30px rgba(168,85,247,.2); }
    .badge__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--grad); }
    .proc { display: grid; gap: 2rem; }
    @media (min-width: 900px) { .proc { grid-template-columns: 1fr 1.1fr; align-items: stretch; } }
    .proc__list { list-style: none; margin: 0; padding: 0; display: grid; }
    .proc__list button { width: 100%; display: flex; gap: 1.25rem; align-items: baseline; padding: 1.15rem 0; border-bottom: 1px solid var(--line); text-align: left; color: var(--text-2); transition: color .3s, padding .4s var(--ease); }
    .proc__list button.is-active, .proc__list button:hover { color: #fff; padding-left: .75rem; }
    .proc__n { font-family: var(--f-display); font-size: .85rem; color: var(--purple); }
    .proc__t { font-family: var(--f-display); font-weight: 600; font-size: clamp(1.3rem, 2.4vw, 2rem); letter-spacing: -.03em; }
    .proc__detail { position: relative; min-height: 300px; }
    .proc__card { height: 100%; display: grid; align-content: end; gap: 1rem; padding: 2.25rem; border-radius: var(--radius-lg); background: radial-gradient(circle at 80% 10%, rgba(168,85,247,.3), transparent 60%), var(--bg-2); border: 1px solid var(--line); animation: in .5s var(--ease); }
    .proc__big { font-family: var(--f-display); font-weight: 700; font-size: clamp(4rem, 9vw, 7rem); line-height: .9; letter-spacing: -.06em; }
    .proc__bar { height: 3px; background: var(--line); border-radius: 3px; overflow: hidden; margin-top: 1rem; }
    .proc__bar span { display: block; height: 100%; background: var(--grad); transition: width .6s var(--ease); }
  `,
})
export class DevelopmentComponent {
  protected readonly groups = DEV_SERVICES;
  protected readonly stack = TECH_STACK;
  protected readonly process = DEV_PROCESS;
  protected readonly tab = signal(0);
  protected readonly step = signal(0);

  constructor() {
    // Support deep links like /development#mobile
    inject(ActivatedRoute).fragment.pipe(takeUntilDestroyed()).subscribe((hash) => {
      const idx = DEV_SERVICES.findIndex((g) => g.id === hash);
      if (idx >= 0) this.tab.set(idx);
    });
  }

  contactFor(id: string): string {
    return CONTACT_MAP[id] ?? 'Other';
  }

  onTabKey(e: KeyboardEvent): void {
    const n = this.groups.length;
    let i = this.tab();
    if (e.key === 'ArrowRight') i = (i + 1) % n;
    else if (e.key === 'ArrowLeft') i = (i - 1 + n) % n;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = n - 1;
    else return;
    e.preventDefault();
    this.tab.set(i);
    document.getElementById('tab-' + this.groups[i].id)?.focus();
  }
}
