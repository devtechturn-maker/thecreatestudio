import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Typographic wordmark: small stacked "THE", bold "Create", outlined "Studio", gradient spark. */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="brand" [class.brand--lg]="large()" aria-label="TheCreateStudio">
      <span class="the" aria-hidden="true">THE</span>
      <span class="create" aria-hidden="true">Create</span>
      <span class="studio" aria-hidden="true">Studio</span>
      <span class="spark" aria-hidden="true"></span>
    </span>
  `,
  styles: `
    .brand { display:inline-flex; align-items:baseline; font-family:var(--f-display); font-size:1.45rem; letter-spacing:-.045em; line-height:1; position:relative; }
    .the { font-family:var(--f-alt); font-size:.38em; font-weight:800; letter-spacing:.12em; writing-mode:vertical-rl; transform:rotate(180deg); margin-right:.18em; color:var(--text-2); align-self:center; }
    .create { font-weight:700; }
    .studio { font-weight:500; color:transparent; -webkit-text-stroke:1px currentColor; -webkit-text-stroke-color:rgba(255,255,255,.75); margin-left:.04em; }
    .spark { width:.32em; height:.32em; border-radius:50%; background:var(--grad); margin-left:.12em; align-self:flex-start; transition:transform .6s var(--ease); }
    .brand:hover .spark { transform:scale(1.5) rotate(90deg); border-radius:30%; }
    .brand--lg { font-size:clamp(2.5rem, 9vw, 7rem); }
    .brand--lg .studio { -webkit-text-stroke-width:2px; }
  `,
})
export class BrandComponent {
  readonly large = input(false);
}
