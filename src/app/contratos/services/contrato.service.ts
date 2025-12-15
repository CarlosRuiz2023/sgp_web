import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Contrato, ContratosResponse } from '@contratos/interfaces/contrato.interface';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';
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
export class ContratoService {
  private http = inject(HttpClient);

  private contratosCache = new Map<string, ContratosResponse>();
  private contratoCache = new Map<string, Contrato>();

  getContratos(options: Options): Observable<ContratosResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.contratosCache.has(key)) {
      return of(this.contratosCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<ContratosResponse>(`${baseUrl}/contrato`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.contratosCache.set(key, resp))
        );
    } else {
      return this.http
        .get<ContratosResponse>(`${baseUrl}/contrato`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.contratosCache.set(key, resp))
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
  
  getUsuariosSupervisores(): Observable<UsuariosResponse> {
    return this.http
      .get<UsuariosResponse>(`${baseUrl}/usuario` ,{ params: {filtro: 'id_rol', busqueda: 'Supervisor'} })
      .pipe(
      tap((resp) => console.log("Supervisores "+resp)),
    );
  }
  
  getUsuariosContratistas(): Observable<UsuariosResponse> {
    return this.http
      .get<UsuariosResponse>(`${baseUrl}/usuario` ,{ params: {filtro: 'id_rol', busqueda: 'Contratista'} })
      .pipe(
      tap((resp) => console.log("Contratistas "+resp)),
    );
  }

  updateContrato(id: string, contrato: Partial<Contrato>): Observable<Contrato> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<Contrato>(`${baseUrl}/contrato/${id}`, contrato, { headers }).pipe(
      tap((updatedContrato) => {
        this.updateContratoCache(updatedContrato);
        this.clearContratosListCache(); // 👈 Limpia el caché de listados
      })
    );
  }

  createContrato(
    contratoLike: Partial<Contrato>
  ): Observable<Contrato> {
    const token = localStorage.getItem('token'); // O el nombre que uses para guardar el token
    console.log(token);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http
      .post<Contrato>(`${baseUrl}/contrato`, contratoLike, { headers })
      .pipe(tap((contrato) => {
        this.updateContratoCache(contrato);
        this.clearContratosListCache(); // 👈 Limpia el caché de listados
      }));
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteContrato(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/contrato/${id}`)
      .pipe(
        map(() => true),
        tap(() => {
          this.removeContratoFromCache(id);
          this.clearContratosListCache(); // 👈 Limpia el caché de listados
        })
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarContrato(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/contrato/activar/${id}`,{})
      .pipe(
        map(() => true),
        tap(() => this.clearContratosListCache()) // 👈 Limpia el caché de listados
      );
  }

  updateContratoCache(contrato: Contrato) {
    const contratoId = contrato.id_contrato;
    this.contratoCache.set("" + contratoId, contrato);
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeContratoFromCache(id: string) {
    // Remover de caché individual
    this.contratoCache.delete(id);
  }
  
  // 🔥 NUEVO MÉTODO: Limpia TODO el caché de listados
  clearContratosListCache() {
    this.contratosCache.clear();
    console.log('Caché de listados limpiado completamente');
  }

  // 🔥 MÉTODO OPCIONAL: Limpia TODO el caché (listados + individuales)
  clearAllCache() {
    this.contratosCache.clear();
    this.contratoCache.clear();
    console.log('Todo el caché ha sido limpiado');
  }
}
