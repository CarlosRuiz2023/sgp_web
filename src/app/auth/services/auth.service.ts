import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';

import { AuthResponse, Usuario } from '@auth/interfaces/auth-response.interface';
import { LogoutResponse } from '@auth/interfaces/logout-response.interface';
import { Router } from '@angular/router';

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<Usuario | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'));
  private _errorMessage = signal<string | null>(null);
  private router: Router = inject(Router);
  errorMessage = computed(() => this._errorMessage());

  private http = inject(HttpClient);

  checkStatusResource = rxResource({
    loader: () => this.checkStatus(),
  });

  authStatus = computed<AuthStatus>(() => {
    if (this._authStatus() === 'checking') return 'checking';

    if (this._user()) {
      return 'authenticated';
    }

    return 'not-authenticated';
  });

  user = computed(() => this._user());
  token = computed(this._token);
  //isAdmin = computed(() => this._user()?.id_rol==1 ?? false);

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .post<AuthResponse>(`${baseUrl}/auth`, {
        correo: email,
        contrasenia: password,
      })
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  checkStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.logout();
      return of(false);
    }

    return this.http
      .get<AuthResponse>(`${baseUrl}/auth/check-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  logout() {
    const token = localStorage.getItem('token');
    this.http
      .post<LogoutResponse>(`${baseUrl}/auth/logout`, null,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        tap(() => {
          // limpieza opcional
          this._user.set(null);
          this._token.set(null);
          this._authStatus.set('not-authenticated');
          localStorage.removeItem('token');
          this.router.navigate(['/auth/login']);
        }),
        catchError((error) => {
          return of(null);
        })
      ).subscribe();
  }

  private handleAuthSuccess({ data, success }: AuthResponse) {
    const { token } = data;
    if (this._authStatus() != 'authenticated') {
      this._user.set(data);
    }
    this._authStatus.set('authenticated');
    this._token.set(token);
    this._errorMessage.set(null); // Limpia mensaje de error
    localStorage.setItem('token', token);
    return true;
  }

  private handleAuthError(error: any) {
    const { error: error1 } = error;
    const { data } = error1;
    this._errorMessage.set(typeof data === 'string' ? data : 'Ocurrió un error');
    this.logout();
    return of(false);
  }
}
