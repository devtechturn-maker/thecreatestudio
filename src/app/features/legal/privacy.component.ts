import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="page-hero">
    <div class="container">
      <p class="eyebrow" appReveal="fade">Legal</p>
      <h1 class="display-l" appReveal="mask"><span class="line"><span>Privacy Policy</span></span></h1>
      <p class="lead" appReveal>Last updated: {{ updated }}</p>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="container prose">
      <p class="notice">This is a general template. Please review it with a legal professional and adapt it to your business before publishing.</p>
      <h2>1. Who we are</h2>
      <p>This website is operated by TheCreateStudio, a digital marketing and website/app development agency.</p>
      <h2>2. Information we collect</h2>
      <p>When you submit our contact form we collect the details you provide: your name, company name, email address, phone number, the service you are interested in, your budget range, your project description and your preferred contact method.</p>
      <h2>3. How we use your information</h2>
      <ul>
        <li>To respond to your inquiry and discuss your project.</li>
        <li>To prepare proposals, quotations and timelines you request.</li>
        <li>To maintain records of our communication with you.</li>
      </ul>
      <p>We do not sell your personal information.</p>
      <h2>4. Form processing (Web3Forms)</h2>
      <p>Our contact form is processed by <a href="https://web3forms.com/" target="_blank" rel="noopener noreferrer">Web3Forms</a>, a third-party form service that delivers your submission to our email inbox. Please refer to the Web3Forms privacy policy for details on how they handle data.</p>
      <h2>5. Third-party services</h2>
      <p>This website loads fonts from Google Fonts. Links to social platforms and WhatsApp take you to third-party services governed by their own policies.</p>
      <h2>6. Data retention</h2>
      <p>We keep inquiry information only as long as needed to respond to you and for legitimate business records.</p>
      <h2>7. Your rights</h2>
      <p>You may request access to, correction of, or deletion of your personal information by contacting us through our <a routerLink="/contact">contact page</a>.</p>
      <h2>8. Changes</h2>
      <p>We may update this policy from time to time. Changes will be posted on this page.</p>
    </div>
  </section>`,
})
export class PrivacyComponent {
  protected readonly updated = 'November 2026';
}
