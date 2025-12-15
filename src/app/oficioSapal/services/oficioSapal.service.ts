import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ObrasResponse,
} from '@obras/interfaces/obra.interface';
import {
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';
import { OficioSapalResponse, OficiosSapal } from '../interfaces/oficioSapal.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  filtro?: string | null;
  busqueda?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OficioSapalService {
  private http = inject(HttpClient);

  private oficiosSapalCache = new Map<string, OficioSapalResponse>();
  private oficioSapalCache = new Map<string, OficiosSapal>();

  getOficiosSapal(options: Options): Observable<OficioSapalResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.oficiosSapalCache.has(key)) {
      return of(this.oficiosSapalCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<OficioSapalResponse>(`${baseUrl}/oficio-sapal`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.oficiosSapalCache.set(key, resp))
        );
    } else {
      return this.http
        .get<OficioSapalResponse>(`${baseUrl}/oficio-sapal`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.oficiosSapalCache.set(key, resp))
        );
    }
  }

  getObras(): Observable<ObrasResponse> {
    return this.http
      .get<ObrasResponse>(`${baseUrl}/obra`)
      .pipe(
      //tap((resp) => console.log(resp)),
    );
  }

  getUsuariosSapal(): Observable<UsuariosResponse> {
    return this.http
      .get<UsuariosResponse>(`${baseUrl}/usuario`, { params: { filtro: 'id_rol', busqueda: 'Sapal' } })
      .pipe(
        tap((resp) => console.log("Sapalistas " + resp)),
      );
  }

  updateOficioSapal(id: string, oficioSapal: Partial<OficiosSapal>): Observable<OficiosSapal> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<OficiosSapal>(`${baseUrl}/oficio-sapal/${id}`, oficioSapal,{headers}).pipe(
      tap((updatedOficioSapal) => {
        this.updateOficioSapalCache(updatedOficioSapal);
        this.clearOficiosSapalListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  uploadPdfRecibido(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/oficioSapal/${id}?campo=recibido`, formData).pipe(
      tap((updatedOficioSapal) => {
        this.updateOficioSapalCache(updatedOficioSapal);
        this.clearOficiosSapalListCache(); // 👈 Limpia el caché de listados
      })
    );
  }
  uploadPdfRevisado(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/oficioSapal/${id}?campo=revisado`, formData).pipe(
      tap((updatedOficioSapal) => {
        this.updateOficioSapalCache(updatedOficioSapal);
        this.clearOficiosSapalListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  getPdfRecibido(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/oficioSapal/${id}?campo=recibido`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  getPdfRevisado(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/oficioSapal/${id}?campo=revisado`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  createOficioSapal(
    oficioSapalLike: Partial<OficiosSapal>,
    file: File
  ): Observable<OficiosSapal> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<OficiosSapal>(`${baseUrl}/oficio-sapal`, oficioSapalLike, { headers }).pipe(
      tap((oficioSapal) =>{
         this.updateOficioSapalCache(oficioSapal);
         this.clearOficiosSapalListCache(); // 👈 Limpia el caché de listados
      }),
      switchMap((oficioSapal:any) =>
        this.uploadPdfRecibido(oficioSapal.data.id_oficio_sapal, file).pipe(map(() => oficioSapal))
      )
    );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteOficioSapal(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/oficio-sapal/${id}`)
      .pipe(
        map(() => true),
        tap(() => {
          this.removeOficioSapalFromCache(id);
          this.clearOficiosSapalListCache(); // 👈 Limpia el caché de listados
        })
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarOficioSapal(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/oficio-sapal/activar/${id}`, {})
      .pipe(
        map(() => true),
        tap(() => this.clearOficiosSapalListCache()) // 👈 Limpia el caché de listados
      );
  }

  updateOficioSapalCache(oficioSapal: OficiosSapal) {
    const oficioSapalId = oficioSapal.id_oficio_sapal;
    this.oficioSapalCache.set("" + oficioSapalId, oficioSapal);
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeOficioSapalFromCache(id: string) {
    // Remover de caché individual
    this.oficiosSapalCache.delete(id);
  }

  // 🔥 NUEVO MÉTODO: Limpia TODO el caché de listados
  clearOficiosSapalListCache() {
    this.oficiosSapalCache.clear();
    console.log('Caché de listados limpiado completamente');
  }

  // 🔥 MÉTODO OPCIONAL: Limpia TODO el caché (listados + individuales)
  clearAllCache() {
    this.oficiosSapalCache.clear();
    this.oficioSapalCache.clear();
    console.log('Todo el caché ha sido limpiado');
  }
}
