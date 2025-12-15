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
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';
import { Entrega, EntregasResponse } from '../interfaces/entrega.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  filtro?: string | null;
  busqueda?: string | null;
  gender?: string;
}

@Injectable({ providedIn: 'root' })
export class EntregasService {
  private http = inject(HttpClient);

  private entregasCache = new Map<string, EntregasResponse>();
  private entregaCache = new Map<string, Entrega>();

  getEntregas(options: Options): Observable<EntregasResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.entregasCache.has(key)) {
      return of(this.entregasCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<EntregasResponse>(`${baseUrl}/entrega`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.entregasCache.set(key, resp))
        );
    } else {
      return this.http
        .get<EntregasResponse>(`${baseUrl}/entrega`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.entregasCache.set(key, resp))
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

  getUsuariosFisicos(): Observable<UsuariosResponse> {
    return this.http
      .get<UsuariosResponse>(`${baseUrl}/usuario`, { params: { filtro: 'id_rol', busqueda: 'Obra Publica' } })
      .pipe(
        tap((resp) => console.log("Fisicos " + resp)),
      );
  }

  getUsuariosAdministrativos(): Observable<UsuariosResponse> {
    return this.http
      .get<UsuariosResponse>(`${baseUrl}/usuario`, { params: { filtro: 'id_rol', busqueda: 'Obra Publica' } })
      .pipe(
        tap((resp) => console.log("Administrativos " + resp)),
      );
  }

  updateEntrega(id: string, entrega: Partial<Entrega>): Observable<Entrega> {
    return this.http.put<Entrega>(`${baseUrl}/entrega/${id}`, entrega).pipe(
      tap((updatedEntrega) => {
        this.updateEntregaCache(updatedEntrega);
        this.clearEntregasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  uploadPdfOficioFisico(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/entregas/${id}?campo=oficio-fisico`, formData).pipe(
      tap((updatedEntrega) => {
        this.updateEntregaCache(updatedEntrega);
        this.clearEntregasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  uploadPdfOficioAdministrativo(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/entregas/${id}?campo=oficio-administrativo`, formData).pipe(
      tap((updatedEntrega) => {
        this.updateEntregaCache(updatedEntrega);
        this.clearEntregasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  uploadPdfActaFisica(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/entregas/${id}?campo=acta-fisica`, formData).pipe(
      tap((updatedEntrega) => {
        this.updateEntregaCache(updatedEntrega);
        this.clearEntregasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  uploadPdfActaAdministrativa(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/entregas/${id}?campo=acta-administrativa`, formData).pipe(
      tap((updatedEntrega) => {
        this.updateEntregaCache(updatedEntrega);
        this.clearEntregasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  getPdfOficioFisico(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/entregas/${id}?campo=oficio-fisico`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  getPdfOficioAdministrativo(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/entregas/${id}?campo=oficio-administrativo`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  getPdfActaFisica(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/entregas/${id}?campo=acta-fisica`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  getPdfActaAdministrativa(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/entregas/${id}?campo=acta-administrativa`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  createEntrega(
    entregaLike: Partial<Entrega>,
  ): Observable<Entrega> {
    return this.http.post<Entrega>(`${baseUrl}/entrega`, entregaLike).pipe(
      tap((entrega) => {
        this.updateEntregaCache(entrega);
        this.clearEntregasListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteEntrega(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/entrega/${id}`)
      .pipe(
        map(() => true),
        tap(() => {
          this.removeEntregaFromCache(id);
          this.clearEntregasListCache(); // 👈 Limpia el caché de listados
        })
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarEntrega(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/entrega/activar/${id}`, {})
      .pipe(
        map(() => true),
        tap(() => this.clearEntregasListCache()) // 👈 Limpia el caché de listados
      );
  }

  updateEntregaCache(entrega: Entrega) {
    const entregaId = entrega.id_entrega;
    this.entregaCache.set("" + entregaId, entrega);
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeEntregaFromCache(id: string) {
    // Remover de caché individual
    this.entregasCache.delete(id);
  }
  
  // 🔥 NUEVO MÉTODO: Limpia TODO el caché de listados
  clearEntregasListCache() {
    this.entregasCache.clear();
    console.log('Caché de listados limpiado completamente');
  }

  // 🔥 MÉTODO OPCIONAL: Limpia TODO el caché (listados + individuales)
  clearAllCache() {
    this.entregasCache.clear();
    this.entregaCache.clear();
    console.log('Todo el caché ha sido limpiado');
  }
}
