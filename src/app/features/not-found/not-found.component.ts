import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, IconComponent, MagneticDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="nf">
    <div class="blob blob--purple float" style="width:420px;height:420px;top:10%;left:10%" aria-hidden="true"></div>
    <div class="blob blob--blue float float--slow" style="width:380px;height:380px;bottom:5%;right:10%" aria-hidden="true"></div>
    <div class="container nf__inner">
      <p class="nf__code" aria-hidden="true"><span>4</span><span class="nf__o"></span><span>4</span></p>
      <h1 class="h2">This page wandered off.</h1>
      <p class="lead">The page you're looking for doesn't exist or has moved. Let's get you back on track.</p>
      <div class="btn-row">
        <a routerLink="/" class="btn btn--primary" appMagnetic>Back to Home <app-icon name="arrow" [size]="18" /></a>
        <a routerLink="/contact" class="btn btn--ghost">Contact Us</a>
      </div>
    </div>
  </section>`,
  styles: `
    .nf { position: relative; min-height: 100svh; display: grid; place-items: center; overflow: hidden; padding: calc(var(--nav-h) + 2rem) 0 4rem; text-align: center; }
    .nf__inner { position: relative; z-index: 1; display: grid; justify-items: center; gap: 1.5rem; }
    .nf .lead { margin-inline: auto; }
    .nf .btn-row { justify-content: center; }
    .nf__code { display: flex; align-items: center; gap: .1em; font-family: var(--f-display); font-weight: 700; font-size: clamp(7rem, 24vw, 16rem); line-height: .9; letter-spacing: -.06em; }
    .nf__o { width: .7em; height: .7em; border-radius: 50%; background: var(--grad); animation: wobble 4s ease-in-out infinite; }
    @keyframes wobble { 0%,100% { border-radius: 50%; transform: rotate(0); } 50% { border-radius: 38% 62% 55% 45%; transform: rotate(40deg) scale(.95); } }
  `,
})
export class NotFoundComponent {}
