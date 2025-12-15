import { HttpClient } from '@angular/common/http';
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
import { Firma, FirmaResponse } from '../interfaces/firma.interface';
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  filtro?: string | null;
  busqueda?: string | null;
}

@Injectable({ providedIn: 'root' })
export class FirmasService {
  private http = inject(HttpClient);

  private firmasCache = new Map<string, FirmaResponse>();
  private firmaCache = new Map<string, Firma>();

  getFirmas(options: Options): Observable<FirmaResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.firmasCache.has(key)) {
      return of(this.firmasCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<FirmaResponse>(`${baseUrl}/firma`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => {
            this.firmasCache.set(key, resp);
          })
        );
    } else {
      return this.http
        .get<FirmaResponse>(`${baseUrl}/firma`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => {
            this.firmasCache.set(key, resp);
          })
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

  getUsuariosFirmadores(): Observable<UsuariosResponse> {
    return this.http
      .get<UsuariosResponse>(`${baseUrl}/usuario`, { params: { filtro: 'id_rol', busqueda: 'Desarrollo Urbano' } })
      .pipe(
        tap((resp) => console.log("Firmadores " + resp)),
      );
  }

  updateFirma(id: string, firma: Partial<Firma>): Observable<Firma> {
    return this.http.put<Firma>(`${baseUrl}/firma/${id}`, firma).pipe(
      tap((updatedFirma) => {
        this.updateFirmaCache(updatedFirma);
        this.clearFirmasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  uploadPdf(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'

    return this.http.post<any>(`${baseUrl}/upload/firmas/${id}`, formData).pipe(
      tap((updatedObra) => {
        this.updateFirmaCache(updatedObra);
        this.clearFirmasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  getPdf(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/firmas/${id}`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  createFirma(
    firmaLike: Partial<Firma>
  ): Observable<Firma> {
    return this.http
      .post<Firma>(`${baseUrl}/firma`, firmaLike)
      .pipe(tap((firma) => {
        this.updateFirmaCache(firma);
        this.clearFirmasListCache(); // 👈 Limpia el caché de listados
      }));
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteFirma(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/firma/${id}`)
      .pipe(
        map(() => true),
        tap(() => {
          this.removeFirmaFromCache(id);
          this.clearFirmasListCache(); // 👈 Limpia el caché de listados
        })
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarFirma(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/firma/activar/${id}`, {})
      .pipe(
        map(() => true),
        tap(() => this.clearFirmasListCache()) // 👈 Limpia el caché de listados
      );
  }

  updateFirmaCache(firma: Firma) {
    const firmaId = firma.id_firma;
    this.firmaCache.set("" + firmaId, firma);
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeFirmaFromCache(id: string) {
    // Remover de caché individual
    this.firmaCache.delete(id);
  }
  
  // 🔥 NUEVO MÉTODO: Limpia TODO el caché de listados
  clearFirmasListCache() {
    this.firmasCache.clear();
    console.log('Caché de listados limpiado completamente');
  }

  // 🔥 MÉTODO OPCIONAL: Limpia TODO el caché (listados + individuales)
  clearAllCache() {
    this.firmasCache.clear();
    this.firmaCache.clear();
    console.log('Todo el caché ha sido limpiado');
  }
}
