import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BrandComponent } from '../../shared/components/brand.component';
import { AuthService } from '../../core/api/auth.service';

/** Admin shell: compact top bar, no marketing navigation or footer. */
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <div class="bar__inner">
        <a routerLink="/admin" class="bar__brand" aria-label="Admin home"><app-brand /><span class="tag">Admin</span></a>
        @if (auth.isLoggedIn()) {
          <nav aria-label="Admin">
            <a routerLink="/admin/proposals" routerLinkActive="is-active">Proposals</a>
            <a routerLink="/admin/proposals/new" class="btn btn--primary btn--sm">New proposal</a>
          </nav>
          <div class="bar__user">
            <span class="muted">{{ auth.user()?.email }}</span>
            <button type="button" class="link" (click)="auth.logout()">Log out</button>
          </div>
        }
      </div>
    </header>
    <main id="main" class="adm" tabindex="-1"><router-outlet /></main>
  `,
  styles: `
    .bar { position: sticky; top: 0; z-index: 50; background: rgba(7,25,28,.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }
    .bar__inner { max-width: 1240px; margin: auto; padding: .85rem var(--gutter); display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .bar__brand { display: inline-flex; align-items: center; gap: .75rem; }
    .tag { font-family: var(--f-alt); font-weight: 800; font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: var(--on-accent); background: var(--yellow); padding: .2rem .5rem; border-radius: 6px; }
    nav { display: flex; align-items: center; gap: 1rem; margin-left: auto; }
    nav > a:not(.btn) { font-family: var(--f-alt); font-weight: 700; color: var(--text-2); }
    nav > a.is-active, nav > a:not(.btn):hover { color: #fff; }
    .bar__user { display: flex; align-items: center; gap: .9rem; font-size: .85rem; }
    .link { color: var(--yellow); font-weight: 700; font-family: var(--f-alt); }
    .adm { max-width: 1240px; margin: auto; padding: 2rem var(--gutter) 5rem; outline: none; }
  `,
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
}
