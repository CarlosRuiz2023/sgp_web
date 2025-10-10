import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ColoniasResponse } from '@obras/interfaces/colonia.interface';
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
  gender?: string;
}

const emptyEstimacion: Estimacion = {
  id_estimacion: 0,
  id_obra: 1,
  id_usuario: 1,
  estimacion: 'comosea.pdf',
  finiquito: false,
  avance_fisico: 17.5,
  avance_financiero: 10.2,
  actual: 15000.12,
  anterior: 14000.12,
  fecha_creacion: new Date(),
  estatus: 1,
  obra: {
    calle: 'Obra de ejemplo'
  },
  usuario: {
    nombres: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'López'
  }
};

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

  getEstimacionByIdSlug(idSlug: string): Observable<Estimacion> {
    if (this.estimacionCache.has(idSlug)) {
      return of(this.estimacionCache.get(idSlug)!);
    }

    return this.http
      .get<Estimacion>(`${baseUrl}/estimacion/${idSlug}`)
      .pipe(tap((comite) => this.estimacionCache.set(idSlug, comite)));
  }

  getComiteById(id: string): Observable<Estimacion> {
    if (id === 'new') {
      return of(emptyEstimacion);
    }

    if (this.estimacionCache.has(id)) {
      return of(this.estimacionCache.get(id)!);
    }

    return this.http
      .get<Estimacion>(`${baseUrl}/estimacion/${id}`)
      .pipe(tap((estimacion) => this.estimacionCache.set(id, estimacion)));
  }

  updateEstimacion(id: string, estimacion: Partial<Estimacion>): Observable<Estimacion> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<Estimacion>(`${baseUrl}/estimacion/${id}`, estimacion, { headers }).pipe(
      tap((updatedEstimacion) => this.updateEstimacionCache(updatedEstimacion))
    );
  }

  uploadPdf(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'

    console.log("ID: "+id);

    return this.http.post<any>(`${baseUrl}/upload/estimaciones/${id}`, formData).pipe(
      tap((updatedObra) => this.updateEstimacionCache(updatedObra))
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
      .pipe(tap((estimacion) => this.updateEstimacionCache(estimacion)));
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteEstimacion(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/estimacion/${id}`)
      .pipe(
        map(() => true),
        tap(() => this.removeEstimacionFromCache(id))
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarEstimacion(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/estimacion/activar/${id}`, {})
      .pipe(
        map(() => true),
      );
  }

  updateEstimacionCache(estimacion: Estimacion) {
    const estimacionId = estimacion.id_estimacion;
    this.estimacionCache.set("" + estimacionId, estimacion);
    this.estimacionesCache.forEach((estimacionResponse) => {
      estimacionResponse.data.estimaciones = estimacionResponse.data.estimaciones.map(
        (currentEstimacion: any) =>
          currentEstimacion.id_estimacion === estimacionId ? estimacion : currentEstimacion
      );
    });
    console.log('Caché actualizado');
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeEstimacionFromCache(id: string) {
    // Remover de caché individual
    this.estimacionesCache.delete(id);

    // Remover de caché de listas
    this.estimacionesCache.forEach((estimacionResponse, key) => {
      estimacionResponse.data.estimaciones = estimacionResponse.data.estimaciones.filter(
        (currentEstimacion: any) => currentEstimacion.id_estimacion.toString() !== id
      );

      // Actualizar el total
      estimacionResponse.data.total = estimacionResponse.data.estimaciones.length;
    });

    console.log('Obra eliminada del caché');
  }
  /* 
    // Tome un FileList y lo suba
    uploadImages(images?: FileList): Observable<string[]> {
      if (!images) return of([]);
  
      const uploadObservables = Array.from(images).map((imageFile) =>
        this.uploadImage(imageFile)
      );
  
      return forkJoin(uploadObservables).pipe(
        tap((imageNames) => console.log({ imageNames }))
      );
    }
  
    uploadImage(imageFile: File): Observable<string> {
      const formData = new FormData();
      formData.append('file', imageFile);
  
      return this.http
        .post<{ fileName: string }>(`${baseUrl}/files/product`, formData)
        .pipe(map((resp) => resp.fileName));
    } */
}
