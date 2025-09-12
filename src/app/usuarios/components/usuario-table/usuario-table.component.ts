import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Usuario } from '@usuarios/interfaces/usuario.interface';
import { ProductImagePipe } from '@obras/pipes/product-image.pipe';
import { UsuariosService } from '@usuarios/services/usuarios.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { RolResponse } from '@usuarios/interfaces/rol.interface';

@Component({
  selector: 'usuario-table',
  imports: [ProductImagePipe, RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './usuario-table.component.html',
})
export class UsuarioTableComponent {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  fb = inject(FormBuilder);
  roles = signal<any[]>([]);
  empresas = signal<any[]>([]);

  usuarios = input.required<Usuario[]>();

  usuarioForm = this.fb.group({
    nombres: ['', Validators.required],
    apellido_paterno: ['', Validators.required],
    apellido_materno: ['', Validators.required],
    id_rol: [0, Validators.required],
    id_empresa: [0, Validators.required],
    correo: ['', Validators.required],
    contrasenia: ['', Validators.required],
  });
  id_usuario = 0;

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
    const modal = document.getElementById('my_modal_2') as HTMLDialogElement;
    modal?.showModal();
  }

  ngOnInit(): void {
    this.usuariosService.getRoles().subscribe({
      next: (resp: RolResponse) => {
        this.roles.set(resp.data.roles.rows); // ajusta según tu estructura
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

        this.usuariosService.deleteObra(id).subscribe({
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
                window.location.href = '/?page=1';
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
                window.location.href = '/?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar la obra:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar la obra. Intenta de nuevo.'
            });
          }
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
      (document.getElementById("my_modal_2") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'La Obra se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/?page=1';
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

}
