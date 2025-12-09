import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Obra,
  ObrasResponse,
} from '@obras/interfaces/obra.interface';
import { ColoniasResponse } from '@shared/interfaces/colonia.interface';
import {
  map,
  Observable,
  of,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  filtro?: string | null;
  busqueda?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ObrasService {
  private http = inject(HttpClient);

  private obrasCache = new Map<string, ObrasResponse>();
  private obraCache = new Map<string, Obra>();

  getObras(options: Options): Observable<ObrasResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.obrasCache.has(key)) {
      return of(this.obrasCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<ObrasResponse>(`${baseUrl}/obra`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          tap((resp) => this.obrasCache.set(key, resp))
        );
    } else {
      return this.http
        .get<ObrasResponse>(`${baseUrl}/obra`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          tap((resp) => this.obrasCache.set(key, resp))
        );
    }
  }

  getColonias(): Observable<ColoniasResponse> {
    return this.http
      .get<ColoniasResponse>(`${baseUrl}/colonia`)
      .pipe();
  }

  getObraByIdSlug(idSlug: string): Observable<Obra> {
    if (this.obraCache.has(idSlug)) {
      return of(this.obraCache.get(idSlug)!);
    }

    return this.http
      .get<Obra>(`${baseUrl}/products/${idSlug}`)
      .pipe(tap((product) => this.obraCache.set(idSlug, product)));
  }

  updateObra(id: string, obra: Partial<Obra>): Observable<Obra> {
    return this.http.put<Obra>(`${baseUrl}/obra/${id}`, obra).pipe(
      tap((updatedObra) => {
        this.updateObraCache(updatedObra);
        this.clearObrasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  uploadPdf(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file);

    return this.http.post<any>(`${baseUrl}/upload/obras/${id}`, formData).pipe(
      tap((updatedObra) => {
        this.updateObraCache(updatedObra);
        this.clearObrasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  getPdf(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/obras/${id}`, {
      responseType: 'blob'
    });
  }

  createObra(obraLike: Partial<Obra>): Observable<Obra> {
    return this.http
      .post<Obra>(`${baseUrl}/obra`, obraLike)
      .pipe(
        tap((obra) => {
          this.updateObraCache(obra);
          this.clearObrasListCache(); // 👈 Limpia el caché de listados
        })
      );
  }

  deleteObra(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/obra/${id}`)
      .pipe(
        map(() => true),
        tap(() => {
          this.removeObraFromCache(id);
          this.clearObrasListCache(); // 👈 Limpia el caché de listados
        })
      );
  }

  reactivarObra(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/obra/activar/${id}`, {})
      .pipe(
        map(() => true),
        tap(() => this.clearObrasListCache()) // 👈 Limpia el caché de listados
      );
  }

  updateObraCache(obra: Obra) {
    const obraId = obra.id_obra;
    this.obraCache.set("" + obraId, obra);
    console.log('Caché de obra individual actualizado');
  }

  removeObraFromCache(id: string) {
    this.obraCache.delete(id);
    console.log('Obra eliminada del caché individual');
  }

  // 🔥 NUEVO MÉTODO: Limpia TODO el caché de listados
  clearObrasListCache() {
    this.obrasCache.clear();
    console.log('Caché de listados limpiado completamente');
  }

  // 🔥 MÉTODO OPCIONAL: Limpia TODO el caché (listados + individuales)
  clearAllCache() {
    this.obrasCache.clear();
    this.obraCache.clear();
    console.log('Todo el caché ha sido limpiado');
  }
}