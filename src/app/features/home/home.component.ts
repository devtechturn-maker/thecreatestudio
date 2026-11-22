import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CtaSectionComponent } from '../../shared/components/cta-section.component';
import { HeroVisualComponent } from './hero-visual.component';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { CounterDirective } from '../../shared/directives/counter.directive';
import { MotionService } from '../../core/services/motion.service';
import { SITE } from '../../core/config/site.config';
import { PROJECTS } from '../../core/config/portfolio.data';
import { TESTIMONIALS } from '../../core/config/testimonials.data';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CtaSectionComponent, HeroVisualComponent, MagneticDirective, CounterDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);
  private ctx?: gsap.Context;
  private destroyed = false;

  protected readonly site = SITE;
  // These sections appear by themselves once real (non-demo, non-sample) content is added.
  protected readonly featured = PROJECTS.filter((p) => p.featured && !p.demo).slice(0, 4);
  protected readonly testimonials = TESTIMONIALS.filter((t) => !t.sample);

  protected readonly marquee = ['Google ads', 'Branding', 'SEO', 'Social media', 'Websites', 'Mobile apps', 'Reels'];

  protected readonly chat = [
    { from: 'client', text: 'I have a business, but nobody finds me online.' },
    { from: 'studio', text: 'We build your website, your app and your marketing.' },
    { from: 'result', text: 'Now your customers find you first.' },
  ];
  /** Bar heights, in percent of the tallest bar. */
  protected readonly bars = [22, 36, 30, 58, 74, 100];

  protected readonly services = [
    {
      title: 'Digital marketing', tone: 'teal', link: '/digital-marketing', fragment: undefined,
      text: 'Get more customers from search, social media and ads.',
      items: ['SEO and Google ranking', 'Social media marketing', 'Google and Meta ads'],
    },
    {
      title: 'Website design', tone: 'cream', link: '/development', fragment: 'websites',
      text: 'Fast websites that make visitors call, message or buy.',
      items: ['Business and online store sites', 'Landing pages', 'SEO built in'],
    },
    {
      title: 'Mobile apps', tone: 'coral', link: '/development', fragment: 'mobile',
      text: 'Android and iOS apps people enjoy and keep using.',
      items: ['UI and UX design', 'Android and iOS development', 'Launch and support'],
    },
  ];

  protected readonly steps = [
    { title: 'Talk', text: 'Tell us your idea and goals.' },
    { title: 'Plan', text: 'We share a clear plan and price.' },
    { title: 'Create', text: 'We design and build it with you.' },
    { title: 'Grow', text: 'We launch, track and improve.' },
  ];

  constructor() {
    afterNextRender(() => this.animate());
  }

  protected toServices(): void {
    this.host.nativeElement
      .querySelector('#services')
      ?.scrollIntoView({ behavior: this.motion.reduced ? 'auto' : 'smooth' });
  }

  private animate(): void {
    if (this.motion.reduced) return;
    const { gsap } = this.motion;
    const root = this.host.nativeElement;

    this.ctx = gsap.context(() => {
      // Hero: built paused so nothing flashes while the loader is still on screen.
      const intro = gsap
        .timeline({ paused: true, defaults: { ease: 'power4.out', duration: 0.8 } })
        .from('.hero__eyebrow', { x: -24, autoAlpha: 0 })
        .from('.hero__title .line > span', { yPercent: 115, duration: 1, stagger: 0.12 }, '<.1')
        .from('.hero__text', { y: 18, autoAlpha: 0 }, '<.3')
        .from('.hero__actions > *', { scale: 0.7, autoAlpha: 0, stagger: 0.1, ease: 'back.out(1.8)', clearProps: 'all' }, '<.15')
        .from('.hero__art [data-pop]', { scale: 0.4, autoAlpha: 0, transformOrigin: '50% 50%', stagger: 0.08, ease: 'back.out(1.6)' }, 0.25);
      void this.motion.whenLoaded().then(() => {
        if (!this.destroyed) intro.play();
      });

      // Chat plays out like a real conversation, then the growth bars rise.
      const chat = gsap.timeline({ scrollTrigger: { trigger: '.chat', start: 'top 80%', once: true } });
      gsap.utils.toArray<HTMLElement>('.bubble').forEach((bubble) => {
        const typing = bubble.querySelector('.typing');
        const text = bubble.querySelector('.bubble__text');
        const origin = bubble.classList.contains('bubble--client') ? '0% 100%' : '100% 100%';
        chat
          .from(bubble, { scale: 0.5, autoAlpha: 0, transformOrigin: origin, duration: 0.45, ease: 'back.out(1.7)' })
          .fromTo(typing, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, delay: 0.35 }, '<')
          .from(text, { autoAlpha: 0, duration: 0.3 });
      });
      chat.from('.bar', { scaleY: 0, transformOrigin: '50% 100%', stagger: 0.1, duration: 0.7, ease: 'back.out(1.4)' }, '-=.1');

      gsap.from('.services__head > *', {
        y: 28, autoAlpha: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.services__head', start: 'top 88%', once: true },
      });
      gsap.utils.toArray<HTMLElement>('.service').forEach((card, i) => {
        gsap
          .timeline({ scrollTrigger: { trigger: card, start: 'top 90%', once: true }, delay: window.innerWidth >= 900 ? i * 0.15 : 0 })
          .from(card, { scale: 0.75, y: 35, autoAlpha: 0, transformOrigin: '0% 100%', duration: 0.65, ease: 'back.out(1.5)', clearProps: 'all' })
          .from(card.querySelectorAll('li'), { x: -18, autoAlpha: 0, stagger: 0.09, duration: 0.35 }, '-=.25');
      });

      gsap.from('.how h2', { y: 28, autoAlpha: 0, scrollTrigger: { trigger: '.how', start: 'top 88%', once: true } });
      gsap.utils.toArray<HTMLElement>('.step').forEach((step) => {
        gsap
          .timeline({ scrollTrigger: { trigger: step, start: 'top 92%', once: true } })
          .from(step.querySelector('.step__line'), { scaleX: 0, transformOrigin: 'left', duration: 0.8, ease: 'power3.inOut' })
          .from(step.querySelectorAll('h3, p'), { y: 18, autoAlpha: 0, stagger: 0.1, duration: 0.4 }, '-=.4');
      });
    }, root);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.ctx?.revert();
  }
}
