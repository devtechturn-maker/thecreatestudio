import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-terms',
  imports: [RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="page-hero">
    <div class="container">
      <p class="eyebrow" appReveal="fade">Legal</p>
      <h1 class="display-l" appReveal="mask"><span class="line"><span>Terms &amp; Conditions</span></span></h1>
      <p class="lead" appReveal>Last updated: {{ updated }}</p>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="container prose">
      <p class="notice">This is a general template. Please review it with a legal professional and adapt it to your business before publishing.</p>
      <h2>1. Acceptance of terms</h2>
      <p>By accessing this website you agree to these terms. If you do not agree, please do not use the website.</p>
      <h2>2. Website content</h2>
      <p>Content on this website is provided for general information about our services. Projects marked as "Demo" or "Sample" are illustrative concepts and do not represent work delivered for real clients.</p>
      <h2>3. Intellectual property</h2>
      <p>All branding, text, graphics and code on this website belong to TheCreateStudio unless stated otherwise and may not be reused without permission.</p>
      <h2>4. Inquiries and proposals</h2>
      <p>Submitting an inquiry does not create a contract. Any project engagement will be governed by a separate written agreement or proposal covering scope, timelines, payment and deliverables.</p>
      <h2>5. Third-party links</h2>
      <p>This website may link to third-party websites. We are not responsible for their content or practices.</p>
      <h2>6. Limitation of liability</h2>
      <p>This website is provided "as is". We make no warranties regarding its availability or accuracy and are not liable for any loss arising from its use.</p>
      <h2>7. Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
      <h2>8. Contact</h2>
      <p>Questions about these terms? Reach us via our <a routerLink="/contact">contact page</a>.</p>
    </div>
  </section>`,
})
export class TermsComponent {
  protected readonly updated = 'November 2026';
}
