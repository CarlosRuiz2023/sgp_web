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
import { Solicitud, SolicitudResponse } from '../interfaces/solicitud.interface';
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  filtro?: string | null;
  busqueda?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private http = inject(HttpClient);

  private solicitudesCache = new Map<string, SolicitudResponse>();
  private solicitudCache = new Map<string, Solicitud>();

  getSolicitudes(options: Options): Observable<SolicitudResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.solicitudesCache.has(key)) {
      return of(this.solicitudesCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<SolicitudResponse>(`${baseUrl}/solicitud`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.solicitudesCache.set(key, resp))
        );
    } else {
      return this.http
        .get<SolicitudResponse>(`${baseUrl}/solicitud`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.solicitudesCache.set(key, resp))
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

  getUsuariosLaboratoristas(): Observable<UsuariosResponse> {
    return this.http
      .get<UsuariosResponse>(`${baseUrl}/usuario`, { params: { filtro: 'id_rol', busqueda: 'Obra Publica' } })
      .pipe(
        tap((resp) => console.log("Laboratoristas " + resp)),
      );
  }

  getUsuariosMecanicosDeSuelos(): Observable<UsuariosResponse> {
    return this.http
      .get<UsuariosResponse>(`${baseUrl}/usuario`, { params: { filtro: 'id_rol', busqueda: 'Desarrollo Urbano' } })
      .pipe(
        tap((resp) => console.log("MecanicosDeSuelos " + resp)),
      );
  }

  updateSolicitud(id: string, solicitud: Partial<Solicitud>): Observable<Solicitud> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<Solicitud>(`${baseUrl}/solicitud/${id}`, solicitud, { headers }).pipe(
      tap((updatedSolicitud) => this.updateSolicitudCache(updatedSolicitud))
    );
  }

  uploadPdfSolicitud(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/solicitudes/${id}?campo=solicitud`, formData).pipe(
      tap((updatedSolicitud) => this.updateSolicitudCache(updatedSolicitud))
    );
  }
  uploadPdfLaboratorio(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/solicitudes/${id}?campo=laboratorio`, formData).pipe(
      tap((updatedSolicitud) => this.updateSolicitudCache(updatedSolicitud))
    );
  }
  uploadPdfMecanicaDeSuelos(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'
    return this.http.post<any>(`${baseUrl}/upload/solicitudes/${id}?campo=mecanica_de_suelos`, formData).pipe(
      tap((updatedSolicitud) => this.updateSolicitudCache(updatedSolicitud))
    );
  }

  getPdfSolicitud(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/solicitudes/${id}?campo=solicitud`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  getPdfLaboratorio(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/solicitudes/${id}?campo=laboratorio`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  getPdfMecanicaDeSuelos(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/solicitudes/${id}?campo=mecanica_de_suelos`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  createSolicitud(
    solicitudLike: Partial<Solicitud>,
    file: File
  ): Observable<Solicitud> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<Solicitud>(`${baseUrl}/solicitud`, solicitudLike, { headers }).pipe(
      tap((solicitud) => this.updateSolicitudCache(solicitud)),
      switchMap((solicitud:any) =>
        this.uploadPdfSolicitud(solicitud.data.id_solicitud, file).pipe(map(() => solicitud))
      )
    );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteSolicitud(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/solicitud/${id}`)
      .pipe(
        map(() => true),
        tap(() => this.removeSolicitudFromCache(id))
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarSolicitud(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/solicitud/activar/${id}`, {})
      .pipe(
        map(() => true),
      );
  }

  updateSolicitudCache(solicitud: Solicitud) {
    const solicitudId = solicitud.id_solicitud;
    this.solicitudCache.set("" + solicitudId, solicitud);
    this.solicitudesCache.forEach((solicitudResponse) => {
      solicitudResponse.data.solicitudes = solicitudResponse.data.solicitudes.map(
        (currentSolicitud: any) =>
          currentSolicitud.id_solicitud === solicitudId ? solicitud : currentSolicitud
      );
    });
    console.log('Caché actualizado');
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeSolicitudFromCache(id: string) {
    // Remover de caché individual
    this.solicitudesCache.delete(id);

    // Remover de caché de listas
    this.solicitudesCache.forEach((solicitudResponse, key) => {
      solicitudResponse.data.solicitudes = solicitudResponse.data.solicitudes.filter(
        (currentSolicitud: any) => currentSolicitud.id_solicitud.toString() !== id
      );

      // Actualizar el total
      solicitudResponse.data.total = solicitudResponse.data.solicitudes.length;
    });

    console.log('Solicitud eliminada del caché');
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
