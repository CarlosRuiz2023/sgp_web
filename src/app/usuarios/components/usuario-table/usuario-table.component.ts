import { CurrencyPipe, DatePipe, NgClass, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuariosService } from '@usuarios/services/usuarios.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { Usuario } from '@usuarios/interfaces/usuario.interface';
import { RolResponse } from '@shared/interfaces/rol.interface';
import { EmpresaResponse } from '@shared/interfaces/empresa.interface';
import { AuthService } from '@auth/services/auth.service';

@Component({
  selector: 'usuario-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf, NgClass],
  templateUrl: './usuario-table.component.html',
})
export class UsuarioTableComponent {
  private usuariosService = inject(UsuariosService);
  fb = inject(FormBuilder);
  roles = signal<any[]>([]);
  empresas = signal<any[]>([]);
  authService = inject(AuthService);
  loadUsuarios = output<void>(); // 👈 Ya existe onObraDeleted, agregamos este

  usuarios = input.required<Usuario[]>();

  // Mapa para saber qué contraseña está visible
  passwordVisible: { [id: number]: boolean } = {};

  togglePassword(id: number) {
    this.passwordVisible[id] = !this.passwordVisible[id];
  }

  usuarioForm = this.fb.group({
    nombres: ['', Validators.required],
    apellido_paterno: ['', Validators.required],
    apellido_materno: ['', Validators.required],
    id_rol: [0, Validators.required],
    id_empresa: [0, Validators.required],
    correo: ['', Validators.required],
    contrasenia: ['', Validators.required],
  });

  usuarioFormPassword = this.fb.group({
    contrasenia: ['', Validators.required],
  });
  id_usuario = 0;
  nombre_usuario = 'SIN NOMBRE';

  openEditModal(usuario: Usuario) {
    this.id_usuario = usuario.id_usuario;
    // Poblamos el formulario con los valores de la obra
    this.usuarioForm.patchValue({
      nombres: usuario.nombres,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      id_rol: usuario.id_rol,
      id_empresa: usuario.id_empresa,
      correo: usuario.correo,
      contrasenia: usuario.contrasenia
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_usuario_modal') as HTMLDialogElement;
    modal?.showModal();
  }

  openCambiarContrasenia(usuario: Usuario) {
    this.id_usuario = usuario.id_usuario;
    this.nombre_usuario = usuario.nombres + " " + usuario.apellido_paterno + " " + usuario.apellido_materno;

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('cambiar_contrasenia_modal') as HTMLDialogElement;
    modal?.showModal();
  }

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
  }

  // Output para notificar al componente padre sobre cambios
  onUsuarioDeleted = output<string>();
  onUsuarioUpdated = output<Usuario>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  /* editObra(usuarioId: number) {
    this.router.navigate(['/admin/products', usuarioId]);
  } */

  deleteUsuario(usuarioId: number, usuarioNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el usuario "${usuarioNombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = usuarioId.toString();
        this.deletingIds.add(id);

        this.usuariosService.deleteUsuario(id).subscribe({
          next: (success) => {
            if (success) {
              this.onUsuarioDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Usuario eliminado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                this.loadUsuarios.emit();
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar al usuario:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar al usuario. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarUsuario(usuarioId: number, usuarioNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se reactivara al usuario "${usuarioNombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = usuarioId.toString();
        this.deletingIds.add(id);

        this.usuariosService.reactivarUsuario(id).subscribe({
          next: (success) => {
            if (success) {
              this.onUsuarioDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Obra reactivada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                this.loadUsuarios.emit();
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar el usuario:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar la usuario. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  desloguearUsuario(usuarioId: number, usuarioNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se deslogueara al usuario "${usuarioNombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desloguear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = usuarioId.toString();
        this.deletingIds.add(id);

        this.usuariosService.desloguearUsuario(id).subscribe({
          next: (success) => {
            if (success) {
              this.onUsuarioDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Usuario deslogueado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/usuarios?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al desloguear el usuario:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo desloguear al usuario. Intenta de nuevo.'
            });
          },
        });
      }
    });
  }


  isDeleting(obraId: number): boolean {
    return this.deletingIds.has(obraId.toString());
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
      await firstValueFrom(this.usuariosService.updateUsuario("" + this.id_usuario, usuarioLike));

      // cerrar modal
      (document.getElementById("editar_usuario_modal") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'El Usuario se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        this.loadUsuarios.emit();
      });
    } catch (error) {
      console.error('Error al actualizar la obra:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la obra. Intenta de nuevo.'
      });
    }

  }

  async onSubmitUpdatePassword() {
    const isValid = this.usuarioFormPassword.valid;
    this.usuarioForm.markAllAsTouched();

    console.log(isValid);
    if (!isValid) return;
    const formValue = this.usuarioFormPassword.value;

    const usuarioLike: Partial<Usuario> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.usuariosService.updatePassword("" + this.id_usuario, usuarioLike));

      // cerrar modal
      (document.getElementById("cambiar_contrasenia_modal") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'El usuario se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        this.loadUsuarios.emit();
      });
    } catch (error) {
      console.error('Error al actualizar al usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar al usuario. Intenta de nuevo.'
      });
    }

  }

  verPdf(id_usuario: number) {
    this.usuariosService.getPdf(id_usuario).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank'); // abre el PDF en una nueva pestaña
      },
      error: (err) => {
        console.error('Error al obtener elPDF', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener el PDF. Intenta de nuevo.'
        });
      }
    });
  }

  getColorClase(estatus: number) {
    return {
      0: 'bg-error/30',
      1: 'bg-base-300',
    }[estatus] || '';
  }

}
