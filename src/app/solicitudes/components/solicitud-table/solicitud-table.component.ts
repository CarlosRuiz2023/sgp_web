import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { Usuario } from '@auth/interfaces/user.interface';
import { SolicitudesService } from '@solicitudes/services/solicitudes.service';
import { Solicitud } from '@solicitudes/interfaces/solicitud.interface';

@Component({
  selector: 'solicitud-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './solicitud-table.component.html',
})
export class SolicitudTableComponent {
  private solicitudesService = inject(SolicitudesService);
  fb = inject(FormBuilder);
  obras = signal<any[]>([]);

  solicitudes = input.required<Solicitud[]>();
  laboratoristas = input.required<Usuario[]>();
  mecanicosDeSuelos = input.required<Usuario[]>();

  solicitudForm = this.fb.group({
    id_obra: [0, Validators.required],
    id_usuario_laboratorio: [0, Validators.required],
    id_usuario_ms: [0, Validators.required],
  });
  id_solicitud = 0;

  openEditModal(solicitud: Solicitud) {
    this.id_solicitud = solicitud.id_solicitud;
    // Poblamos el formulario con los valores de la obra
    this.solicitudForm.patchValue({
      id_obra: solicitud.id_obra,
      id_usuario_laboratorio: solicitud.id_usuario_laboratorio,
      id_usuario_ms: solicitud.id_usuario_ms
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_solicitud_model') as HTMLDialogElement;
    modal?.showModal();
  }

  ngOnInit(): void {
    this.solicitudesService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
  }

  // Output para notificar al componente padre sobre cambios
  onSolicitudDeleted = output<string>();
  onSolicitudUpdated = output<Solicitud>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  /* editEstimacion(estimacionId: number) {
    this.router.navigate(['/admin/products', estimacionId]);
  } */

  deleteSolicitud(solicitudId: number, solicitudNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la solicitud ${solicitudId} de la obra ${solicitudNombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = solicitudId.toString();
        this.deletingIds.add(id);

        this.solicitudesService.deleteSolicitud(id).subscribe({
          next: (success) => {
            if (success) {
              this.onSolicitudDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Solicitud eliminada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/solicitudes?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar la solicitud:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la solicitud. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarSolicitud(solicitudId: number, solicitudNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se reactivara la solicitud ${solicitudId} de la obra ${solicitudNombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = solicitudId.toString();
        this.deletingIds.add(id);

        this.solicitudesService.reactivarSolicitud(id).subscribe({
          next: (success) => {
            if (success) {
              this.onSolicitudDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Solicitud reactivada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/solicitudes?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar la solicitud:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar la solicitud. Intenta de nuevo.'
            });
          }
        });
      }
    });
  }


  isDeleting(solicitudId: number): boolean {
    return this.deletingIds.has(solicitudId.toString());
  }

  async onSubmit() {
    const isValid = this.solicitudForm.valid;
    this.solicitudForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.solicitudForm.value;

    const solicitudLike: Partial<Solicitud> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.solicitudesService.updateSolicitud("" + this.id_solicitud, solicitudLike));

      // cerrar modal
      (document.getElementById("editar_solicitud_model") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'La Solicitud se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/solicitudes?page=1';
      });
    } catch (error) {
      console.error('Error al actualizar la solicitud:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la solicitud. Intenta de nuevo.'
      });
    }

  }

  onPdfSelectedLaboratorio(event: Event, id_solicitud: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.solicitudesService.uploadPdfLaboratorio(id_solicitud, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/solicitudes?page=1';
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

  onPdfSelectedMecanicaDeSuelos(event: Event, id_solicitud: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.solicitudesService.uploadPdfMecanicaDeSuelos(id_solicitud, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/solicitudes?page=1';
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

  verPdfSolicitud(id_solicitud: number) {
    this.solicitudesService.getPdfSolicitud(id_solicitud).subscribe({
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

  verPdfLaboratorio(id_solicitud: number) {
    this.solicitudesService.getPdfLaboratorio(id_solicitud).subscribe({
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

  verPdfMecanicaDeSuelos(id_solicitud: number) {
    this.solicitudesService.getPdfMecanicaDeSuelos(id_solicitud).subscribe({
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
