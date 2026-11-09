import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, effect, inject, input, signal, viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { CtaSectionComponent } from '../../shared/components/cta-section.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { MotionService } from '../../core/services/motion.service';
import { PORTFOLIO_CATEGORIES, PROJECTS, PortfolioCategory, Project } from '../../core/config/portfolio.data';

@Component({
  selector: 'app-portfolio',
  imports: [RouterLink, IconComponent, CtaSectionComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
})
export class PortfolioComponent implements OnDestroy {
  /** Bound from the `?project=slug` query param (withComponentInputBinding). */
  readonly project = input<string | undefined>();

  private readonly router = inject(Router);
  private readonly motion = inject(MotionService);
  private readonly grid = viewChild<ElementRef<HTMLElement>>('grid');
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private lastFocus: HTMLElement | null = null;

  protected readonly categories: ('All Projects' | PortfolioCategory)[] = ['All Projects', ...PORTFOLIO_CATEGORIES];
  protected readonly filter = signal<'All Projects' | PortfolioCategory>('All Projects');
  protected readonly projects = computed(() =>
    this.filter() === 'All Projects' ? PROJECTS : PROJECTS.filter((p) => p.category === this.filter()),
  );
  protected readonly count = (c: string) => (c === 'All Projects' ? PROJECTS.length : PROJECTS.filter((p) => p.category === c).length);
  protected readonly selected = computed<Project | undefined>(() => PROJECTS.find((p) => p.slug === this.project()));

  constructor() {
    // Open/close the detail dialog whenever the query param changes.
    effect(() => {
      const d = this.dialog()?.nativeElement;
      if (!d) return;
      if (this.selected() && !d.open) {
        this.lastFocus = document.activeElement as HTMLElement;
        d.showModal();
      } else if (!this.selected() && d.open) {
        d.close();
      }
    });
  }

  setFilter(c: 'All Projects' | PortfolioCategory): void {
    if (c === this.filter()) return;
    this.filter.set(c);
    const grid = this.grid()?.nativeElement;
    if (!grid || this.motion.reduced) return;
    const { gsap } = this.motion;
    // Content updates immediately; the animation is purely decorative.
    setTimeout(() => {
      gsap.fromTo(grid.children, { autoAlpha: 0, y: 30, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', clearProps: 'all' });
      this.motion.refresh();
    });
  }

  open(p: Project): void {
    this.router.navigate([], { queryParams: { project: p.slug }, queryParamsHandling: 'merge' });
  }

  close(): void {
    this.router.navigate([], { queryParams: { project: null }, queryParamsHandling: 'merge' });
    setTimeout(() => this.lastFocus?.focus());
  }

  onBackdrop(e: MouseEvent): void {
    if (e.target === this.dialog()?.nativeElement) this.close();
  }

  ngOnDestroy(): void {
    if (this.grid()) this.motion.gsap.killTweensOf(this.grid()!.nativeElement.children);
  }
}
