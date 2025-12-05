import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';

import { AuthResponse, Usuario } from '@auth/interfaces/auth-response.interface';
import { LogoutResponse } from '@auth/interfaces/logout-response.interface';
import { Router } from '@angular/router';
import { CheckResponse } from '@auth/interfaces/check-response.interface';
import Swal from 'sweetalert2';
import { RecoverResponse } from '@auth/interfaces/recover-response.interface';

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<Usuario | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'));
  private _errorMessage = signal<string | null>(null);
  private router: Router = inject(Router);
  private _permisos = signal<{ [modulo: string]: string[] }>({});

  permisos = computed(() => this._permisos());
  errorMessage = computed(() => this._errorMessage());

  private http = inject(HttpClient);

  /* checkStatusResource = rxResource({
    loader: () => this.checkStatus(),
  }); */

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

  recover(email: string): Observable<boolean> {
    return this.http
      .post<RecoverResponse>(`${baseUrl}/auth/recuperar`, {
        correo: email,
      })
      .pipe(
        map((resp) => this.handleAuthRecover(resp)),
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
      .get<CheckResponse>(`${baseUrl}/auth/check-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        map((resp) => this.handleAuthSuccessCheckStatus(resp)),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  logout() {
    const token = localStorage.getItem('token');
    this.http
      .post<LogoutResponse>(`${baseUrl}/auth/logout`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        tap(() => {
          // limpieza opcional
          this._user.set(null);
          this._token.set(null);
          this._permisos.set({});  // ← limpiar permisos
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
    const { Usuario, permisos_por_modulo } = data;
    const { token } = Usuario;
    // Guardar usuario
    if (this._authStatus() !== 'authenticated') {
      this._user.set(Usuario);
    }

    // Guardar permisos (solo en RAM)
    this._permisos.set(permisos_por_modulo);

    // Estado general
    this._authStatus.set('authenticated');
    this._token.set(token);
    this._errorMessage.set(null);

    // Guardar token (solo esto va en localStorage)
    localStorage.setItem('token', token);
    // Obtener primer módulo accesible
    const primerModulo = this.getPrimerModulo(permisos_por_modulo);

    // Navegar según permisos
    if (primerModulo) {
      this.router.navigateByUrl('/' + primerModulo.toLowerCase());
    } else {
      // En caso de que no tenga acceso a nada
      this.router.navigateByUrl('/sin-permisos');
    }
    return true;
  }

  private handleAuthRecover({ data, success }: RecoverResponse) {
    Swal.fire({
      title: '¡Correo Enviado!',
      text: 'Se ha enviado un correo para restablecimiento de contraseña al correo proporcionado',
      icon: 'success',
      showConfirmButton: false,   // 🔹 Oculta el botón
      timer: 4000,                // 🔹 Se cierra a los 2 segundos
      timerProgressBar: true      // (opcional) barra de progreso
    }).then(() => {
      // recargar la página después de cerrar el alert
      window.location.href = '/';
    });
    return true;
  }

  private handleAuthSuccessCheckStatus({ data, success }: CheckResponse) {
    const { token } = data;
    // Estado general
    this._token.set(token);
    this._errorMessage.set(null);

    // Guardar token (solo esto va en localStorage)
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

  tienePermiso(modulo: string, permiso: string): boolean {
    const mod = this.permisos()[modulo];
    return mod ? mod.includes(permiso) : false;
  }

  getPrimerModulo(permisos: any): string | null {
    const modulos = Object.keys(permisos);

    for (const modulo of modulos) {
      if (permisos[modulo]?.includes('Consultar')) {
        return modulo;
      }
    }
    return null;
  }

  isAdmin() {
    return this.user()?.id_rol === 1;
  }
}
