import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { LoaderComponent } from './shared/components/loader.component';
import { CursorComponent } from './shared/components/cursor.component';
import { SeoData, SeoService } from './core/services/seo.service';

@Component({
  selector: 'app-root',
  imports: [MainLayoutComponent, LoaderComponent, CursorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-loader /><app-cursor /><app-main-layout />`,
})
export class App {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  constructor() {
    this.seo.addOrganizationSchema();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => {
        let r = this.route.snapshot;
        while (r.firstChild) r = r.firstChild;
        const data = r.data['seo'] as SeoData | undefined;
        if (data) this.seo.update(data, (e as NavigationEnd).urlAfterRedirects);
      });
  }
}
