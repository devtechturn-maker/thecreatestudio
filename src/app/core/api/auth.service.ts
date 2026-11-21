import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from './api.models';

const STORAGE_KEY = 'tcs-admin-session';

interface Session {
  token: string;
  expiresAt: string;
  name: string;
  email: string;
}

/** Admin session (JWT). Stored in sessionStorage so it ends when the browser tab closes. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(this.restore());

  readonly user = computed(() => this.session());
  readonly isLoggedIn = computed(() => {
    const s = this.session();
    return !!s && new Date(s.expiresAt).getTime() > Date.now();
  });

  get token(): string | null {
    return this.isLoggedIn() ? this.session()!.token : null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBase}/auth/login`, { email, password }).pipe(
      tap((r) => {
        const s: Session = { token: r.token, expiresAt: r.expiresAt, name: r.name, email: r.email };
        this.session.set(s);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        } catch {
          /* storage unavailable — session lasts until reload */
        }
      }),
    );
  }

  logout(redirect = true): void {
    this.session.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (redirect) this.router.navigate(['/admin/login']);
  }

  private restore(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
