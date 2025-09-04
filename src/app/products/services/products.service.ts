import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ColoniasResponse } from '@products/interfaces/colonia.interface';
import {
  Obra,
  ObrasResponse,
} from '@products/interfaces/obra.interface';
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
  gender?: string;
}

const emptyObra: Obra = {
  id_obra: 1,
  id_colonia: 1,
  calle: 'Manzanares',
  traza_du: 'Traza DU',
  tramo: 'De aqui pa aya',
  finiquito: 0,
  estatus: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  colonia: {
    colonia: 'Jardines de San Juan',
  }
};

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

    if(filtro && busqueda){
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
        //tap((resp) => console.log(resp)),
        tap((resp) => this.obrasCache.set(key, resp))
      );
    }else{
      return this.http
      .get<ObrasResponse>(`${baseUrl}/obra`, {
        params: {
          limit,
          offset
        },
      })
      .pipe(
        //tap((resp) => console.log(resp)),
        tap((resp) => this.obrasCache.set(key, resp))
      );
    }
  }

  getColonias(): Observable<ColoniasResponse> {
    return this.http
      .get<ColoniasResponse>(`${baseUrl}/colonia`)
      .pipe(
        //tap((resp) => console.log(resp)),
      );
  }

  getProductByIdSlug(idSlug: string): Observable<Obra> {
    if (this.obraCache.has(idSlug)) {
      return of(this.obraCache.get(idSlug)!);
    }

    return this.http
      .get<Obra>(`${baseUrl}/products/${idSlug}`)
      .pipe(tap((product) => this.obraCache.set(idSlug, product)));
  }

  getProductById(id: string): Observable<Obra> {
    if (id === 'new') {
      return of(emptyObra);
    }

    if (this.obraCache.has(id)) {
      return of(this.obraCache.get(id)!);
    }

    return this.http
      .get<Obra>(`${baseUrl}/obra/${id}`)
      .pipe(tap((product) => this.obraCache.set(id, product)));
  }

  updateObra(id: string, obra: Partial<Obra>): Observable<Obra> {
    return this.http.put<Obra>(`${baseUrl}/obra/${id}`, obra).pipe(
      tap((updatedObra) => this.updateObraCache(updatedObra))
    );
  }

  createObra(
    obraLike: Partial<Obra>
  ): Observable<Obra> {
    return this.http
      .post<Obra>(`${baseUrl}/obra`, obraLike)
      .pipe(tap((obra) => this.updateObraCache(obra)));
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteObra(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/obra/${id}`)
      .pipe(
        map(() => true),
        tap(() => this.removeObraFromCache(id))
      );
  }

  updateObraCache(obra: Obra) {
    const obraId = obra.id_obra;

    this.obraCache.set("" + obraId, obra);

    this.obrasCache.forEach((obrasResponse) => {
      obrasResponse.data.obras = obrasResponse.data.obras.map(
        (currentObra: any) =>
          currentObra.id_obra === obraId ? obra : currentObra
      );
    });

    console.log('Caché actualizado');
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeObraFromCache(id: string) {
    // Remover de caché individual
    this.obraCache.delete(id);

    // Remover de caché de listas
    this.obrasCache.forEach((obrasResponse, key) => {
      obrasResponse.data.obras = obrasResponse.data.obras.filter(
        (currentObra: any) => currentObra.id_obra.toString() !== id
      );

      // Actualizar el total
      obrasResponse.data.total = obrasResponse.data.obras.length;
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
