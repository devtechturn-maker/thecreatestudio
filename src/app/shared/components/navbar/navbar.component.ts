import {
  ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, HostListener, effect, inject, signal, viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BrandComponent } from '../brand.component';
import { IconComponent } from '../icon.component';
import { MagneticDirective } from '../../directives/magnetic.directive';
import { MotionService } from '../../../core/services/motion.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, BrandComponent, IconComponent, MagneticDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  private readonly motion = inject(MotionService);
  protected readonly scrolled = signal(false);
  protected readonly hidden = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly dropdownOpen = signal(false);
  protected readonly servicesActive = signal(false);
  private readonly mobilePanel = viewChild<ElementRef<HTMLElement>>('mobilePanel');
  private readonly burger = viewChild<ElementRef<HTMLButtonElement>>('burger');
  private lastY = 0;

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => {
        this.menuOpen.set(false);
        this.dropdownOpen.set(false);
        this.servicesActive.set(/^\/(digital-marketing|development)/.test((e as NavigationEnd).urlAfterRedirects));
      });

    effect(() => {
      const open = this.menuOpen();
      this.doc.body.style.overflow = open ? 'hidden' : '';
      const panel = this.mobilePanel()?.nativeElement;
      if (open && panel) {
        if (!this.motion.reduced) {
          this.motion.gsap.fromTo(panel.querySelectorAll('[data-m-item]'),
            { yPercent: 100, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power4.out', stagger: 0.06, delay: 0.15 });
        }
        setTimeout(() => panel.querySelector<HTMLElement>('a')?.focus(), 50);
      }
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const y = window.scrollY;
    this.scrolled.set(y > 30);
    this.hidden.set(!this.menuOpen() && y > 400 && y > this.lastY);
    this.lastY = y;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.burger()?.nativeElement.focus();
    }
    this.dropdownOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  onDropdownFocusOut(e: FocusEvent, host: HTMLElement): void {
    if (!host.contains(e.relatedTarget as Node)) this.dropdownOpen.set(false);
  }
}
