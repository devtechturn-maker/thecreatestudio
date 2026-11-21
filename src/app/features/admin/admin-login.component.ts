import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/api/auth.service';
import { apiError } from '../../core/api/api.models';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="login">
      <form class="adm-card login__card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h1 class="h3">Admin sign in</h1>
        <p class="muted">Manage proposals, signatures and payments.</p>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" class="input" formControlName="email" autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" class="input" formControlName="password" autocomplete="current-password" />
        </div>
        @if (error()) { <p class="adm-alert" role="alert">{{ error() }}</p> }
        <button type="submit" class="btn btn--primary" [disabled]="form.invalid || busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
      </form>
    </section>
  `,
  styles: `
    .login { min-height: 70vh; display: grid; place-items: center; }
    .login__card { width: min(420px, 100%); display: grid; gap: 1.25rem; }
    .login__card .btn { justify-self: stretch; }
  `,
})
export class AdminLoginComponent {
  readonly returnUrl = input<string>();
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        const target = this.returnUrl();
        this.router.navigateByUrl(target && target.startsWith('/admin') ? target : '/admin/proposals');
      },
      error: (e) => {
        this.error.set(apiError(e, 'Invalid email or password.'));
        this.busy.set(false);
      },
    });
  }
}
