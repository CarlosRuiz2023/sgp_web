import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { UsuarioTableComponent } from "@usuarios/components/usuario-table/usuario-table.component";
import { Usuario } from '@usuarios/interfaces/usuario.interface';
import { UsuariosService } from '@usuarios/services/usuarios.service';
import { RolResponse } from '@shared/interfaces/rol.interface';
import { EmpresaResponse } from '@shared/interfaces/empresa.interface';

@Component({
  selector: 'obra-page',
  imports: [PaginationComponent, UsuarioTableComponent, ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './usuario-page.component.html',
})
export class UsuarioPageComponent {
  usuario = input.required<Usuario>();
  usuariosService = inject(UsuariosService);
  totalPaginas = signal(0);
  usuarios = signal<Usuario[]>([]);
  paginationService = inject(PaginationService);
  usuariosPerPage = signal(10);
  roles = signal<any[]>([]);
  empresas = signal<any[]>([]);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  usuarioForm = this.fb.group({
    apellido_paterno: ['', Validators.required],
    apellido_materno: ['', Validators.required],
    nombres: ['', Validators.required],
    correo: ['', Validators.required],
    contrasenia: ['', Validators.required],
    id_rol: ['', Validators.required],
    id_empresa: ['', Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_usuario', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.usuariosService.getRoles().subscribe({
      next: (resp: RolResponse) => {
        this.roles.set(resp.data.roles.rows); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });

    this.usuariosService.getEmpresas().subscribe({
      next: (resp: EmpresaResponse) => {
        this.empresas.set(resp.data.empresas.rows); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });

    // carga inicial de obras si quieres
    //this.loadObras(0, this.obrasPerPage());
  }

  paginationEffect = effect(() => {
    const page = this.paginationService.currentPage(); // signal del PaginationService
    const offset = (page - 1) * this.usuariosPerPage();
    this.loadUsuarios(offset, this.usuariosPerPage());
  });

  loadUsuarios(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    console.log("Cargando obras con:", { offset, limit, filtro, busqueda });
    this.usuariosService.getUsuarios({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp:any) => {
        this.usuarios.set(resp.data.usuarios);
        this.totalPaginas.set(resp.data.totalPaginas);
      },
      error: (err) => console.error('Error al cargar obras:', err),
    });
  }

  async onSubmit() {
    const isValid = this.usuarioForm.valid;
    this.usuarioForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.usuarioForm.value;

    const usuarioLike: Partial<Usuario> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.usuariosService.createUsuario(usuarioLike));
      // cerrar modal
      (document.getElementById("agregar_usuario_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'El Usuario se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/usuarios?page=1';
      });
    } catch (error) {
      console.error("Error al guardar usuario:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadUsuarios(0, this.usuariosPerPage());
  }

}
