import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from './icon.component';

/** Generated abstract artwork for a service: tinted gradient, orbit rings, animated icon. */
@Component({
  selector: 'app-service-visual',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sv" [style.--h]="hue()" role="img" [attr.aria-label]="label() + ' illustration'">
      <span class="ring r1"></span><span class="ring r2"></span><span class="ring r3"></span>
      <span class="dot d1"></span><span class="dot d2"></span>
      <span class="core"><app-icon [name]="icon()" [size]="44" /></span>
      <span class="no">{{ no() }}</span>
    </div>`,
  styles: `
    :host { display: block; }
    .sv { --h: 270; position: relative; aspect-ratio: 4/3; border-radius: 24px; overflow: hidden; isolation: isolate;
      background: radial-gradient(circle at 30% 20%, rgba(255,224,27,.28), transparent 55%),
                  radial-gradient(circle at 80% 90%, rgba(19,128,140,.55), transparent 55%), var(--teal);
      border: 1px solid var(--line); display: grid; place-items: center; }
    .ring { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,.14); transition: transform 1.2s var(--ease); }
    .r1 { width: 40%; aspect-ratio: 1; } .r2 { width: 62%; aspect-ratio: 1; border-style: dashed; animation: rot 30s linear infinite; } .r3 { width: 86%; aspect-ratio: 1; }
    .dot { position: absolute; width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 20px #fff; }
    .d1 { top: 22%; left: 24%; animation: float 6s ease-in-out infinite; } .d2 { bottom: 24%; right: 22%; width: 6px; height: 6px; animation: float 8s ease-in-out infinite reverse; }
    .core { position: relative; width: 96px; height: 96px; border-radius: 28px; display: grid; place-items: center; color: var(--on-accent);
      background: var(--grad); box-shadow: 0 20px 50px rgba(255,224,27,.3);
      transition: transform .8s var(--ease); }
    .no { position: absolute; left: 1.2rem; bottom: .6rem; font-family: var(--f-display); font-weight: 700; font-size: 3.5rem; letter-spacing: -.05em; color: rgba(255,255,255,.1); }
    :host-context(.svc:hover) .core, .sv:hover .core { transform: rotate(-10deg) scale(1.1); }
    :host-context(.svc:hover) .r1, .sv:hover .r1 { transform: scale(1.25); }
    :host-context(.svc:hover) .r3, .sv:hover .r3 { transform: scale(.9); }
    @keyframes rot { to { transform: rotate(360deg); } }
  `,
})
export class ServiceVisualComponent {
  readonly icon = input.required<string>();
  readonly hue = input(270);
  readonly no = input('');
  readonly label = input('');
}
