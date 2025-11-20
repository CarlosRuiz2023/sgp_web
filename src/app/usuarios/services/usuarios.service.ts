import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EmpresaResponse } from '@shared/interfaces/empresa.interface';
import { RolResponse } from '@shared/interfaces/rol.interface';
import { Usuario, UsuariosResponse } from '@usuarios/interfaces/usuario.interface';
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
export class UsuariosService {
  private http = inject(HttpClient);

  private usuariosCache = new Map<string, UsuariosResponse>();
  private usuarioCache = new Map<string, Usuario>();

  getUsuarios(options: Options): Observable<UsuariosResponse> {
    const { limit = 9, offset = 0, filtro, busqueda } = options;

    const key = `${limit}-${offset}-${filtro ?? ''}-${busqueda ?? ''}`;
    if (this.usuariosCache.has(key)) {
      return of(this.usuariosCache.get(key)!);
    }

    if (filtro && busqueda) {
      return this.http
        .get<UsuariosResponse>(`${baseUrl}/usuario`, {
          params: {
            limit,
            offset,
            filtro,
            busqueda
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.usuariosCache.set(key, resp))
        );
    } else {
      return this.http
        .get<UsuariosResponse>(`${baseUrl}/usuario`, {
          params: {
            limit,
            offset
          },
        })
        .pipe(
          //tap((resp) => console.log(resp)),
          tap((resp) => this.usuariosCache.set(key, resp))
        );
    }
  }

  getRoles(): Observable<RolResponse> {
    return this.http
      .get<RolResponse>(`${baseUrl}/rol`)
      .pipe(
      //tap((resp) => console.log(resp)),
    );
  }

  getEmpresas(): Observable<EmpresaResponse> {
    return this.http
      .get<EmpresaResponse>(`${baseUrl}/empresa`)
      .pipe(
      //tap((resp) => console.log(resp)),
    );
  }

  updateUsuario(id: string, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${baseUrl}/usuario/${id}`, usuario).pipe(
      tap((updatedUsuario) => this.updateUsuarioCache(updatedUsuario))
    );
  }

  updatePassword(id: string, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${baseUrl}/usuario/actualizarContrasenia/${id}`, usuario).pipe(
      tap((updatedUsuario) => this.updateUsuarioCache(updatedUsuario))
    );
  }

  uploadPdf(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file); // 👈 clave 'archivo'

    return this.http.post<any>(`${baseUrl}/upload/obras/${id}`, formData).pipe(
      tap((updatedUsuario) => this.updateUsuarioCache(updatedUsuario))
    );
  }

  getPdf(id: number): Observable<Blob> {
    return this.http.get(`${baseUrl}/upload/obras/${id}`, {
      responseType: 'blob' // 👈 importante para recibir el archivo
    });
  }

  createUsuario(
    obraLike: Partial<Usuario>
  ): Observable<Usuario> {
    return this.http
      .post<Usuario>(`${baseUrl}/usuario`, obraLike)
      .pipe(tap((usuario) => this.updateUsuarioCache(usuario)));
  }

  // NUEVO MÉTODO PARA ELIMINAR USUARIO
  deleteUsuario(id: string): Observable<boolean> {
    return this.http
      .delete<any>(`${baseUrl}/usuario/${id}`)
      .pipe(
        map(() => true),
        tap(() => this.removeUsuarioFromCache(id))
      );
  }

  // NUEVO MÉTODO PARA REACTIVAR USUARIO
  reactivarUsuario(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/usuario/activar/${id}`,{})
      .pipe(
        map(() => true),
      );
  }

  // NUEVO MÉTODO PARA DESLOGUEAR USUARIO
  desloguearUsuario(id: string): Observable<boolean> {
    return this.http
      .put<any>(`${baseUrl}/auth/${id}`,{})
      .pipe(
        map(() => true),
      );
  }

  updateUsuarioCache(usuario: Usuario) {
    const usuarioId = usuario.id_usuario;

    this.usuarioCache.set("" + usuarioId, usuario);

    this.usuariosCache.forEach((usuariosResponse) => {
      usuariosResponse.data.usuarios = usuariosResponse.data.usuarios.map(
        (currentUsuario: any) =>
          currentUsuario.id_usuario === usuarioId ? usuario : currentUsuario
      );
    });

    console.log('Caché actualizado');
  }

  // NUEVO MÉTODO PARA REMOVER DEL CACHÉ
  removeUsuarioFromCache(id: string) {
    // Remover de caché individual
    this.usuarioCache.delete(id);

    // Remover de caché de listas
    this.usuariosCache.forEach((usuariosResponse, key) => {
      usuariosResponse.data.usuarios = usuariosResponse.data.usuarios.filter(
        (currentUsuario: any) => currentUsuario.id_usuario.toString() !== id
      );

      // Actualizar el total
      usuariosResponse.data.total = usuariosResponse.data.usuarios.length;
    });

    console.log('Usuario eliminada del caché');
  }
}
