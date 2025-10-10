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
  gender?: string;
}

const emptyContrato: Contrato = {
  id_contrato: 1,
  id_usuario: 1,
  id_usuario_contratista: 1,
  id_usuario_supervisor: 1,
  id_obra: 1,
  costo_real: 0,
  fecha_inicio: new Date(),
  fecha_termino: new Date(),
  usuario: {
    nombres: 'Usuario',
    apellido_paterno: 'NA',
    apellido_materno: 'NA'
  },
  supervisor: {
    nombres: 'Supervisor',
    apellido_paterno: 'NA',
    apellido_materno: 'NA'
  },
  contratista: {
    nombres: 'Contratista',
    apellido_paterno: 'NA',
    apellido_materno: 'NA'
  },
  estatus: 1,
  obra: {
    calle: 'Calle Falsa 123'
  }
};

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
    console.log(token);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<Contrato>(`${baseUrl}/contrato/${id}`, contrato, { headers }).pipe(
      tap((updatedContrato) => this.updateContratoCache(updatedContrato))
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
      .pipe(tap((contrato) => this.updateContratoCache(contrato)));
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  deleteContrato(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/contrato/${id}`)
      .pipe(
        map(() => true),
        tap(() => this.removeContratoFromCache(id))
      );
  }

  // NUEVO MÉTODO PARA ELIMINAR OBRA
  reactivarContrato(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/contrato/activar/${id}`,{})
      .pipe(
        map(() => true),
      );
  }

  updateContratoCache(contrato: Contrato) {
    const contratoId = contrato.id_contrato;

    this.contratoCache.set("" + contratoId, contrato);

    this.contratosCache.forEach((contratosResponse) => {
      contratosResponse.data.contratos = contratosResponse.data.contratos.map(
        (currentContrato: any) =>
          currentContrato.id_contrato === contratoId ? contrato : currentContrato
      );
    });

    console.log('Caché actualizado');
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeContratoFromCache(id: string) {
    // Remover de caché individual
    this.contratoCache.delete(id);

    // Remover de caché de listas
    this.contratosCache.forEach((ContratosResponse, key) => {
      ContratosResponse.data.contratos = ContratosResponse.data.contratos.filter(
        (currentContrato: any) => currentContrato.id_contrato.toString() !== id
      );

      // Actualizar el total
      ContratosResponse.data.total = ContratosResponse.data.contratos.length;
    });

    console.log('Contrato eliminado del caché');
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
