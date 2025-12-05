import { CurrencyPipe, DatePipe, NgClass, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { OficioSapalService } from '../../services/oficioSapal.service';
import { OficiosSapal } from '../../interfaces/oficioSapal.interface';
import { Usuario } from '@usuarios/interfaces/usuario.interface';
import { AuthService } from '@auth/services/auth.service';

@Component({
  selector: 'oficio-sapal-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf, NgClass],
  templateUrl: './oficioSapal-table.component.html',
})
export class OficioSapalTableComponent {
  private oficioSapalService = inject(OficioSapalService);
  fb = inject(FormBuilder);
  obras = signal<any[]>([]);

  oficiosSapal = input.required<OficiosSapal[]>();
  sapaleros = input.required<Usuario[]>();
  authService = inject(AuthService);

  oficioSapalForm = this.fb.group({
    id_obra: [0, Validators.required],
    id_usuario: [0],
    observaciones: [''],
    id_usuario_sapal: [0, Validators.required],
  });
  id_oficio_sapal = 0;

  openEditModal(oficioSapal: OficiosSapal) {
    this.id_oficio_sapal = oficioSapal.id_oficio_sapal;
    // Poblamos el formulario con los valores de la obra
    this.oficioSapalForm.patchValue({
      id_obra: oficioSapal.id_obra,
      id_usuario: oficioSapal.id_usuario,
      id_usuario_sapal: oficioSapal.id_usuario_sapal,
      observaciones: oficioSapal.observaciones,
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_oficio_sapal_model') as HTMLDialogElement;
    modal?.showModal();
  }

  ngOnInit(): void {
    this.oficioSapalService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
  }

  // Output para notificar al componente padre sobre cambios
  onOficioSapalDeleted = output<string>();
  onOficioSapalUpdated = output<OficiosSapal>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  /* editEstimacion(estimacionId: number) {
    this.router.navigate(['/admin/products', estimacionId]);
  } */

  deleteOficioSapal(oficioSapalId: number, oficioSapalNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el oficio sapal ${oficioSapalId} de la obra ${oficioSapalNombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = oficioSapalId.toString();
        this.deletingIds.add(id);

        this.oficioSapalService.deleteOficioSapal(id).subscribe({
          next: (success) => {
            if (success) {
              this.onOficioSapalDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Oficio sapal eliminado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/oficios-sapal?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar el oficio sapal:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el oficio sapal. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarOficioSapal(oficioSapalId: number, oficioSapalNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se reactivara el oficio sapal ${oficioSapalId} de la obra ${oficioSapalNombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = oficioSapalId.toString();
        this.deletingIds.add(id);

        this.oficioSapalService.reactivarOficioSapal(id).subscribe({
          next: (success) => {
            if (success) {
              this.onOficioSapalDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Oficio sapal reactivado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/oficios-sapal?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar el oficio sapal:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar el oficio sapal. Intenta de nuevo.'
            });
          }
        });
      }
    });
  }


  isDeleting(oficioSapalId: number): boolean {
    return this.deletingIds.has(oficioSapalId.toString());
  }

  async onSubmit() {
    const isValid = this.oficioSapalForm.valid;
    this.oficioSapalForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.oficioSapalForm.value;

    const oficioSapalLike: Partial<OficiosSapal> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.oficioSapalService.updateOficioSapal("" + this.id_oficio_sapal, oficioSapalLike));

      // cerrar modal
      (document.getElementById("editar_oficio_sapal_model") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'El oficio sapal se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/oficios-sapal?page=1';
      });
    } catch (error) {
      console.error('Error al actualizar el oficio sapal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el oficio sapal. Intenta de nuevo.'
      });
    }

  }

  onPdfSelectedRecibido(event: Event, id_oficio_sapal: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.oficioSapalService.uploadPdfRecibido(id_oficio_sapal, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/oficios-sapal?page=1';
          });
        },
        error: (err) => {
          console.error('Error al subir el PDF ', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo subir el PDF. Intenta de nuevo.'
          });
        }
      });
    }
  }

  onPdfSelectedRevisado(event: Event, id_oficio_sapal: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.oficioSapalService.uploadPdfRevisado(id_oficio_sapal, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/oficios-sapal?page=1';
          });
        },
        error: (err) => {
          console.error('Error al subir el PDF ', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo subir el PDF. Intenta de nuevo.'
          });
        }
      });
    }
  }

  verPdfRecibido(id_oficio_sapal: number) {
    this.oficioSapalService.getPdfRecibido(id_oficio_sapal).subscribe({
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

  verPdfRevisado(id_oficio_sapal: number) {
    this.oficioSapalService.getPdfRevisado(id_oficio_sapal).subscribe({
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
