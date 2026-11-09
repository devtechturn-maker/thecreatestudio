import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Typographic wordmark based on the TheCreateStudio logo:
 * "THE" in a yellow speech bubble with burst lines, bold white "CREATE",
 * and spaced yellow "STUDIO" beneath.
 */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="brand" [class.brand--lg]="large()" role="img" aria-label="TheCreateStudio">
      <span class="burst" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="the" aria-hidden="true">THE</span>
      <span class="words" aria-hidden="true">
        <span class="create">CRE<span class="a">A</span>TE</span>
        <span class="studio">STUDIO</span>
      </span>
    </span>
  `,
  styles: `
    .brand { --s: 1; position: relative; display: inline-flex; align-items: flex-start; gap: .28em; font-family: var(--f-display); font-size: calc(1.35rem * var(--s)); line-height: 1; padding-top: .35em; }
    .burst { position: absolute; left: -.35em; top: -.05em; width: .7em; height: .6em; }
    .burst i { position: absolute; bottom: 0; left: 50%; width: .09em; height: .38em; border-radius: .05em; background: var(--yellow); transform-origin: bottom center; transition: transform .5s var(--ease); }
    .burst i:nth-child(1) { transform: translateX(-50%) rotate(-55deg); }
    .burst i:nth-child(2) { transform: translateX(-50%) rotate(-25deg); }
    .burst i:nth-child(3) { transform: translateX(-50%) rotate(5deg); }
    .the { position: relative; background: var(--yellow); color: var(--on-accent); font-weight: 700; letter-spacing: -.02em; padding: .14em .22em .1em; border-radius: .18em; }
    .the::after { content: ''; position: absolute; right: .12em; bottom: -.28em; width: .32em; height: .32em; background: var(--yellow); clip-path: polygon(0 0, 100% 0, 100% 100%); }
    .words { display: grid; gap: .16em; }
    .create { font-weight: 700; letter-spacing: -.01em; color: #fff; }
    .create .a { color: var(--yellow); }
    .studio { font-family: var(--f-alt); font-weight: 600; font-size: .42em; letter-spacing: .55em; color: var(--yellow); }
    .brand:hover .burst i:nth-child(1) { transform: translateX(-50%) rotate(-65deg) scaleY(1.2); }
    .brand:hover .burst i:nth-child(3) { transform: translateX(-50%) rotate(15deg) scaleY(1.2); }
    .brand--lg { --s: 3; }
    @media (max-width: 600px) { .brand--lg { --s: 2; } }
  `,
})
export class BrandComponent {
  readonly large = input(false);
}
