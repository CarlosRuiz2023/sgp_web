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
import { Firma, FirmaResponse } from '../interfaces/firma.interface';
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  filtro?: string | null;
  busqueda?: string | null;
  gender?: string;
}

const emptyFirma: Firma = {
  id_firma: 0,
  id_obra: 1,
  id_usuario: 1,
  plano: 'comosea.pdf',
  fecha_de_firma: new Date(),
  estatus: 1,
  obra: {
    calle: 'Obra de ejemplo'
  },
  firmador: {
    nombres: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'López'
  }
};

@Injectable({ providedIn: 'root' })
export class FirmasService {
  private http = inject(HttpClient);

  private firmasCache = new Map<string, FirmaResponse>();
  private firmaCache = new Map<string, Firma>();

  getEstimaciones(options: Options): Observable<FirmaResponse> {
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
          tap((resp) => this.firmasCache.set(key, resp))
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
          tap((resp) => this.firmasCache.set(key, resp))
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
      tap((updatedFirma) => this.updateFirmaCache(updatedFirma))
    );
  }

  uploadPdf(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'

    console.log("ID: " + id);

    return this.http.post<any>(`${baseUrl}/upload/firmas/${id}`, formData).pipe(
      tap((updatedObra) => this.updateFirmaCache(updatedObra))
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
      .pipe(tap((firma) => this.updateFirmaCache(firma)));
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteFirma(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/firma/${id}`)
      .pipe(
        map(() => true),
        tap(() => this.removeFirmaFromCache(id))
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarFirma(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/firma/activar/${id}`, {})
      .pipe(
        map(() => true),
      );
  }

  updateFirmaCache(firma: Firma) {
    const firmaId = firma.id_firma;
    this.firmaCache.set("" + firmaId, firma);
    this.firmasCache.forEach((firmaResponse) => {
      firmaResponse.data.firmas = firmaResponse.data.firmas.map(
        (currentFirma: any) =>
          currentFirma.id_firma === firmaId ? firma : currentFirma
      );
    });
    console.log('Caché actualizado');
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeFirmaFromCache(id: string) {
    // Remover de caché individual
    this.firmasCache.delete(id);

    // Remover de caché de listas
    this.firmasCache.forEach((firmaResponse, key) => {
      firmaResponse.data.firmas = firmaResponse.data.firmas.filter(
        (currentFirma: any) => currentFirma.id_firma.toString() !== id
      );

      // Actualizar el total
      firmaResponse.data.total = firmaResponse.data.firmas.length;
    });

    console.log('Firma eliminada del caché');
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
