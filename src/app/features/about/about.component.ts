import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { BrandComponent } from '../../shared/components/brand.component';
import { CtaSectionComponent } from '../../shared/components/cta-section.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ParallaxDirective } from '../../shared/directives/parallax.directive';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';

@Component({
  selector: 'app-about',
  imports: [RouterLink, IconComponent, BrandComponent, CtaSectionComponent, RevealDirective, ParallaxDirective, MagneticDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="page-hero" aria-labelledby="about-title">
    <div class="blob blob--purple float" style="width:500px;height:500px;top:-12%;right:-10%" aria-hidden="true"></div>
    <div class="container">
      <p class="eyebrow" appReveal="fade">About us</p>
      <h1 id="about-title" class="display-l" appReveal="mask">
        <span class="line"><span>Marketing, design</span></span>
        <span class="line"><span>&amp; technology —</span></span>
        <span class="line"><span class="grad-text">under one roof.</span></span>
      </h1>
    </div>
  </section>

  <section class="section who" aria-labelledby="who-title">
    <div class="container who__grid">
      <div class="who__brand" appParallax="0.1" aria-hidden="true"><app-brand [large]="true" /></div>
      <div class="who__text">
        <p class="eyebrow" appReveal="fade">Who we are</p>
        <h2 id="who-title" class="h3" appReveal>TheCreateStudio is a creative digital agency combining marketing, design, and technology to help businesses build a powerful digital presence.</h2>
        <p class="lead" appReveal>Most businesses juggle a designer, a marketer and a developer who never talk to each other. We bring all three together so your brand, your content and your product tell one consistent story — and grow together.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt" aria-label="Mission and vision">
    <div class="container mv">
      <article class="mv__card" appReveal="scale">
        <span class="mv__label">Our Mission</span>
        <p class="mv__text">To make professional digital solutions accessible to businesses through creativity, innovation, and technology.</p>
        <app-icon name="target" [size]="64" class="mv__icon" />
      </article>
      <article class="mv__card mv__card--alt" appReveal="scale" [revealDelay]="0.1">
        <span class="mv__label">Our Vision</span>
        <p class="mv__text">To become a trusted creative and technology partner for brands looking to grow in the digital world.</p>
        <app-icon name="compass" [size]="64" class="mv__icon" />
      </article>
    </div>
  </section>

  <section class="section" aria-labelledby="diff-title">
    <div class="container">
      <div class="section-head section-head--split">
        <div>
          <p class="eyebrow" appReveal="fade">What makes us different?</p>
          <h2 id="diff-title" class="h2" appReveal="mask"><span class="line"><span>Six reasons brands</span></span><span class="line"><span class="grad-text">choose to grow with us.</span></span></h2>
        </div>
        <p class="lead" appReveal>We're built around how modern businesses actually grow — online, across channels, with marketing and technology working as one.</p>
      </div>
      <ol class="diff">
        @for (d of diffs; track d.title; let i = $index) {
          <li class="diff__row" appReveal>
            <span class="diff__no">0{{ i + 1 }}</span>
            <h3 class="diff__title">{{ d.title }}</h3>
            <p class="muted">{{ d.text }}</p>
            <span class="icon-badge"><app-icon [name]="d.icon" /></span>
          </li>
        }
      </ol>
    </div>
  </section>

  <section class="section section--light" aria-labelledby="two-title">
    <div class="container two">
      <h2 id="two-title" class="h2" appReveal>Two divisions, one goal: <span class="grad-text">your growth.</span></h2>
      <div class="two__cards">
        <a routerLink="/digital-marketing" class="two__card" appReveal appMagnetic [strength]="0.08">
          <span>01</span><strong>Digital Marketing &amp; Brand Growth</strong><app-icon name="arrowUpRight" />
        </a>
        <a routerLink="/development" class="two__card" appReveal [revealDelay]="0.1" appMagnetic [strength]="0.08">
          <span>02</span><strong>Website &amp; App Development</strong><app-icon name="arrowUpRight" />
        </a>
      </div>
    </div>
  </section>

  <app-cta-section />
  `,
  styles: `
    .who__grid { display: grid; gap: 3rem; align-items: center; }
    @media (min-width: 1000px) { .who__grid { grid-template-columns: 1fr 1.2fr; } }
    .who__brand { padding: 2rem; border-radius: var(--radius-lg); background: radial-gradient(circle at 30% 30%, rgba(255,224,27,.25), transparent 60%), var(--bg-2); border: 1px solid var(--line); min-height: 320px; display: grid; place-items: center; overflow: hidden; }
    .who__text { display: grid; gap: 1.5rem; }
    .who__text .h3 { font-size: clamp(1.6rem, 3vw, 2.5rem); }
    .mv { display: grid; gap: 1.5rem; }
    @media (min-width: 900px) { .mv { grid-template-columns: 1fr 1fr; } }
    .mv__card { position: relative; overflow: hidden; display: grid; gap: 1.5rem; padding: clamp(2rem, 5vw, 3.5rem); border-radius: var(--radius-lg); background: radial-gradient(circle at 85% 10%, rgba(255,224,27,.25), transparent 55%), var(--teal); border: 1px solid rgba(255,224,27,.25); min-height: 340px; align-content: space-between; }
    .mv__card--alt { background: var(--light); color: #111; }
    .mv__label { font-family: var(--f-alt); font-weight: 800; letter-spacing: .2em; text-transform: uppercase; font-size: .8rem; }
    .mv__text { font-family: var(--f-display); font-weight: 600; font-size: clamp(1.5rem, 2.8vw, 2.3rem); letter-spacing: -.03em; line-height: 1.15; }
    .mv__icon { position: absolute; right: 1.5rem; top: 1.5rem; opacity: .3; animation: float 6s ease-in-out infinite; }
    .diff { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
    .diff__row { display: grid; gap: .75rem 2rem; padding: 2rem 0; border-bottom: 1px solid var(--line); align-items: center; transition: padding .5s var(--ease), background .5s; }
    @media (min-width: 900px) { .diff__row { grid-template-columns: 80px 1.1fr 1.4fr 60px; } }
    .diff__row:hover { padding-inline: 1rem; background: rgba(255,255,255,.02); }
    .diff__no { font-family: var(--f-display); color: var(--purple); }
    .diff__title { font-family: var(--f-display); font-size: clamp(1.4rem, 2.6vw, 2.1rem); letter-spacing: -.03em; line-height: 1.1; }
    .two { display: grid; gap: 3rem; }
    .two__cards { display: grid; gap: 1.5rem; }
    @media (min-width: 900px) { .two__cards { grid-template-columns: 1fr 1fr; } }
    .two__card { display: grid; gap: 3rem; padding: 2rem; border-radius: var(--radius); background: #fff; border: 1px solid #e4e4e7; position: relative; transition: box-shadow .5s, background .5s, color .5s; }
    .two__card span { font-family: var(--f-display); color: var(--purple); }
    .two__card strong { font-family: var(--f-display); font-size: clamp(1.4rem, 2.5vw, 2rem); letter-spacing: -.03em; line-height: 1.1; max-width: 14ch; }
    .two__card app-icon { position: absolute; right: 2rem; top: 2rem; }
    .two__card:hover { background: #111; color: #fff; box-shadow: 0 30px 60px rgba(0,0,0,.15); }
  `,
})
export class AboutComponent {
  protected readonly diffs = [
    { icon: 'layers', title: 'Marketing + Development Under One Roof', text: 'One team handles your brand, content, website and app — consistent, faster and simpler for you.' },
    { icon: 'bulb', title: 'Creative and Strategic Approach', text: 'Bold ideas grounded in research, goals and a clear understanding of your audience.' },
    { icon: 'cpu', title: 'Modern Technology', text: 'We build with current, reliable frameworks for speed, security and scalability.' },
    { icon: 'chart', title: 'Business-Focused Solutions', text: 'Every deliverable is tied to a business outcome — awareness, leads, sales or efficiency.' },
    { icon: 'mail', title: 'Transparent Communication', text: 'Clear timelines, honest reporting and a single point of contact throughout.' },
    { icon: 'handshake', title: 'Long-Term Support', text: 'We continue to maintain, improve and grow with you long after launch.' },
  ];
}
