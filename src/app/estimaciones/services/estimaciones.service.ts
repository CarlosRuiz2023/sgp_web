import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ObrasResponse,
} from '@obras/interfaces/obra.interface';
import {
  map,
  Observable,
  of,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { Estimacion, EstimacionResponse } from '../interfaces/estimacion.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  filtro?: string | null;
  busqueda?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EstimacionesService {
  private http = inject(HttpClient);

  private estimacionesCache = new Map<string, EstimacionResponse>();
  private estimacionCache = new Map<string, Estimacion>();

  getEstimaciones(options: Options): Observable<EstimacionResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.estimacionesCache.has(key)) {
      return of(this.estimacionesCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<EstimacionResponse>(`${baseUrl}/estimacion`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.estimacionesCache.set(key, resp))
        );
    } else {
      return this.http
        .get<EstimacionResponse>(`${baseUrl}/estimacion`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.estimacionesCache.set(key, resp))
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

  updateEstimacion(id: string, estimacion: Partial<Estimacion>): Observable<Estimacion> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<Estimacion>(`${baseUrl}/estimacion/${id}`, estimacion, { headers }).pipe(
      tap((updatedEstimacion) => {
        this.updateEstimacionCache(updatedEstimacion);
        this.clearEstimacionesListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  uploadPdf(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'

    return this.http.post<any>(`${baseUrl}/upload/estimaciones/${id}`, formData).pipe(
      tap((updatedObra) => {
        this.updateEstimacionCache(updatedObra);
        this.clearEstimacionesListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  getPdf(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/estimaciones/${id}`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  createEstimacion(
    estimacionLike: Partial<Estimacion>
  ): Observable<Estimacion> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http
      .post<Estimacion>(`${baseUrl}/estimacion`, estimacionLike, { headers })
      .pipe(tap((estimacion) => {
        this.updateEstimacionCache(estimacion);
        this.clearEstimacionesListCache(); // 👈 Limpia el caché de listados
      }));
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteEstimacion(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/estimacion/${id}`)
      .pipe(
        map(() => true),
        tap(() => {
          this.removeEstimacionFromCache(id);
          this.clearEstimacionesListCache(); // 👈 Limpia el caché de listados
        })
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarEstimacion(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/estimacion/activar/${id}`, {})
      .pipe(
        map(() => true),
        tap(() => this.clearEstimacionesListCache()) // 👈 Limpia el caché de listados
      );
  }

  updateEstimacionCache(estimacion: Estimacion) {
    const estimacionId = estimacion.id_estimacion;
    this.estimacionCache.set("" + estimacionId, estimacion);
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeEstimacionFromCache(id: string) {
    // Remover de caché individual
    this.estimacionesCache.delete(id);
  }
  
  // 🔥 NUEVO MÉTODO: Limpia TODO el caché de listados
  clearEstimacionesListCache() {
    this.estimacionesCache.clear();
    console.log('Caché de listados limpiado completamente');
  }

  // 🔥 MÉTODO OPCIONAL: Limpia TODO el caché (listados + individuales)
  clearAllCache() {
    this.estimacionesCache.clear();
    this.estimacionCache.clear();
    console.log('Todo el caché ha sido limpiado');
  }
}
