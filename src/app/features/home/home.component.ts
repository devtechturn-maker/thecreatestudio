import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { CtaSectionComponent } from '../../shared/components/cta-section.component';
import { HeroVisualComponent } from './hero-visual.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { CounterDirective } from '../../shared/directives/counter.directive';
import { ParallaxDirective } from '../../shared/directives/parallax.directive';
import { MotionService } from '../../core/services/motion.service';
import { SITE } from '../../core/config/site.config';
import { PROJECTS } from '../../core/config/portfolio.data';
import { TESTIMONIALS } from '../../core/config/testimonials.data';

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, CtaSectionComponent, HeroVisualComponent, RevealDirective, MagneticDirective, CounterDirective, ParallaxDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);
  private ctx?: gsap.Context;

  protected readonly site = SITE;
  protected readonly featured = PROJECTS.filter((p) => p.featured).slice(0, 4);
  protected readonly testimonials = TESTIMONIALS;

  protected readonly divisions = [
    {
      no: '01', title: ['Digital Marketing', '& Brand Growth'], link: '/digital-marketing', cta: 'Explore Digital Marketing', icon: 'chart',
      text: 'We build brand awareness, create engaging content, and develop marketing strategies that turn audiences into customers.',
      items: ['Social Media Management', 'Creative Graphic Designing', 'Reels & Video Editing', 'SEO & GEO', 'Paid Advertising', 'Email Marketing', 'Brand Strategy'],
    },
    {
      no: '02', title: ['Website &', 'App Development'], link: '/development', cta: 'Explore Development', icon: 'cpu',
      text: 'We transform business ideas into powerful digital products through modern websites, web applications, and mobile applications.',
      items: ['Business Websites', 'E-commerce Websites', 'Custom Web Applications', 'Android & iOS Applications', 'UI/UX Design', 'SaaS Development'],
    },
  ];

  protected readonly reasons = [
    { icon: 'grid', title: 'Complete Digital Solutions', text: 'Marketing, design and development from one team — no juggling multiple agencies.' },
    { icon: 'bulb', title: 'Creative Thinking', text: 'Ideas that stand out in crowded feeds and memorable experiences that stick.' },
    { icon: 'compass', title: 'Strategy-Driven Execution', text: 'Every post, page and feature starts with a clear goal and a plan to reach it.' },
    { icon: 'cpu', title: 'Modern Technology', text: 'Fast, secure, scalable builds on proven modern frameworks.' },
    { icon: 'target', title: 'Result-Oriented Approach', text: 'We focus on the metrics that matter to your business, and report them honestly.' },
    { icon: 'handshake', title: 'Long-Term Partnership', text: 'We stay with you after launch — improving, supporting and growing together.' },
  ];

  protected readonly process = [
    { title: 'Discover', text: 'We learn your business, audience, competitors and goals.' },
    { title: 'Strategize', text: 'We craft a clear roadmap — channels, content, features and timelines.' },
    { title: 'Create', text: 'Designers, marketers and developers bring the plan to life.' },
    { title: 'Launch', text: 'We go live with care — tested, optimised and on brand.' },
    { title: 'Grow', text: 'We measure, learn and iterate to keep results moving up.' },
  ];

  protected readonly marquee = ['Social Media', 'Branding', 'Websites', 'Mobile Apps', 'SEO & GEO', 'Performance Ads', 'UI/UX', 'Reels & Video'];

  constructor() {
    afterNextRender(() => this.animate());
  }

  private async animate(): Promise<void> {
    if (this.motion.reduced) return;
    const root = this.host.nativeElement as HTMLElement;
    const { gsap } = this.motion;
    // Hide hero lines immediately to avoid flash while loader runs.
    const lines = root.querySelectorAll('.hero .line > span');
    gsap.set(lines, { yPercent: 110 });
    gsap.set(root.querySelectorAll('.hero [data-hero-fade]'), { autoAlpha: 0, y: 24 });
    await this.motion.whenLoaded();

    this.ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .to(lines, { yPercent: 0, duration: 1.2, stagger: 0.12 })
        .to('.hero [data-hero-fade]', { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, '-=0.8');

      // Process timeline: progress line scrubbed by scroll.
      gsap.fromTo('.process__progress', { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.process__track', start: 'top 75%', end: 'bottom 45%', scrub: true },
      });
      gsap.utils.toArray<HTMLElement>('.process__step').forEach((step) => {
        gsap.from(step, { y: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: step, start: 'top 85%', once: true } });
      });
    }, root);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
