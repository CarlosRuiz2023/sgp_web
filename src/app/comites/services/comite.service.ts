import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ColoniasResponse } from '@obras/interfaces/colonia.interface';
import {
  Comite,
  ComiteResponse,
} from '@comites/interfaces/comite.interface';
import {
  map,
  Observable,
  of,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { ObrasResponse } from '@obras/interfaces/obra.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  filtro?: string | null;
  busqueda?: string | null;
  gender?: string;
}

const emptyComite: Comite = {
  id_comite: 1,
  id_obra: 1,
  id_usuario: 1,
  sesion: 1,
  tipo: 1,
  punto: 1,
  costo: 0.0,
  fecha_creacion: new Date(),
  estatus: 1,
  obra: {
    calle: 'Calle Falsa 123',
  },
  usuario: {
    nombres: 'Pedro',
    apellido_paterno: 'Vargas',
    apellido_materno: 'Hernandez',
  },
};

@Injectable({ providedIn: 'root' })
export class ComitesService {
  private http = inject(HttpClient);

  private comitesCache = new Map<string, ComiteResponse>();
  private comiteCache = new Map<string, Comite>();

  getComites(options: Options): Observable<ComiteResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.comitesCache.has(key)) {
      return of(this.comitesCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<ComiteResponse>(`${baseUrl}/comite`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.comitesCache.set(key, resp))
        );
    } else {
      return this.http
        .get<ComiteResponse>(`${baseUrl}/comite`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.comitesCache.set(key, resp))
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

  getComiteByIdSlug(idSlug: string): Observable<Comite> {
    if (this.comiteCache.has(idSlug)) {
      return of(this.comiteCache.get(idSlug)!);
    }

    return this.http
      .get<Comite>(`${baseUrl}/comite/${idSlug}`)
      .pipe(tap((comite) => this.comiteCache.set(idSlug, comite)));
  }

  getComiteById(id: string): Observable<Comite> {
    if (id === 'new') {
      return of(emptyComite);
    }

    if (this.comiteCache.has(id)) {
      return of(this.comiteCache.get(id)!);
    }

    return this.http
      .get<Comite>(`${baseUrl}/comite/${id}`)
      .pipe(tap((comite) => this.comiteCache.set(id, comite)));
  }

  createComite(
    comiteLike: Partial<Comite>
  ): Observable<Comite> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    console.log(token);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http
      .post<Comite>(`${baseUrl}/comite`, comiteLike, { headers })
      .pipe(
        tap((comite) => this.updateComiteCache(comite))
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteComite(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/comite/${id}`)
      .pipe(
        map(() => true),
        tap(() => this.removeComiteFromCache(id))
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarComite(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/comite/activar/${id}`, {})
      .pipe(
        map(() => true),
      );
  }

  updateComiteCache(comite: Comite) {
    const comiteId = comite.id_comite;

    this.comiteCache.set("" + comiteId, comite);

    this.comitesCache.forEach((comitesResponse) => {
      comitesResponse.data.comites = comitesResponse.data.comites.map(
        (currentComite: any) =>
          currentComite.id_comite === comiteId ? comite : currentComite
      );
    });

    console.log('Caché actualizado');
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeComiteFromCache(id: string) {
    // Remover de caché individual
    this.comiteCache.delete(id);

    // Remover de caché de listas
    this.comitesCache.forEach((comitesResponse, key) => {
      comitesResponse.data.comites = comitesResponse.data.comites.filter(
        (currentComite: any) => currentComite.id_comite.toString() !== id
      );

      // Actualizar el total
      comitesResponse.data.total = comitesResponse.data.comites.length;
    });

    console.log('Obra eliminada del caché');
  }
}
