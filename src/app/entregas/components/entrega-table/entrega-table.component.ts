import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { EntregasService } from '../../services/entregas.service';
import { Entrega } from '../../interfaces/entrega.interface';
import { Usuario } from '@usuarios/interfaces/usuario.interface';
import { AuthService } from '@auth/services/auth.service';

@Component({
  selector: 'entrega-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './entrega-table.component.html',
})
export class EntregaTableComponent {
  private solicitudesService = inject(EntregasService);
  fb = inject(FormBuilder);
  obras = signal<any[]>([]);

  entregas = input.required<Entrega[]>();
  fisicos = input.required<Usuario[]>();
  administrativos = input.required<Usuario[]>();
  authService = inject(AuthService);

  entregaForm = this.fb.group({
    id_obra: [0, Validators.required],
    id_usuario_fisico: [0, Validators.required],
    id_usuario_administrativo: [0, Validators.required],
  });
  id_entrega = 0;

  openEditModal(entrega: Entrega) {
    this.id_entrega = entrega.id_entrega;
    // Poblamos el formulario con los valores de la obra
    this.entregaForm.patchValue({
      id_obra: entrega.id_obra,
      id_usuario_fisico: entrega.id_usuario_fisico,
      id_usuario_administrativo: entrega.id_usuario_administrativo
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_entrega_model') as HTMLDialogElement;
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
  onEntregaDeleted = output<string>();
  onEntregaUpdated = output<Entrega>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  /* editEstimacion(estimacionId: number) {
    this.router.navigate(['/admin/products', estimacionId]);
  } */

  deleteEntrega(entregaId: number, entregaNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la entrega ${entregaId} de la obra ${entregaNombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = entregaId.toString();
        this.deletingIds.add(id);

        this.solicitudesService.deleteEntrega(id).subscribe({
          next: (success) => {
            if (success) {
              this.onEntregaDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Entrega eliminada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/entregas?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar la entrega:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la entrega. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarEntrega(entregaId: number, entregaNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se reactivara la entrega ${entregaId} de la obra ${entregaNombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = entregaId.toString();
        this.deletingIds.add(id);

        this.solicitudesService.reactivarEntrega(id).subscribe({
          next: (success) => {
            if (success) {
              this.onEntregaDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Entrega reactivada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/entregas?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar la entrega:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar la entrega. Intenta de nuevo.'
            });
          }
        });
      }
    });
  }


  isDeleting(entregaId: number): boolean {
    return this.deletingIds.has(entregaId.toString());
  }

  async onSubmit() {
    const isValid = this.entregaForm.valid;
    this.entregaForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.entregaForm.value;

    const entregaLike: Partial<Entrega> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.solicitudesService.updateEntrega("" + this.id_entrega, entregaLike));

      // cerrar modal
      (document.getElementById("editar_entrega_model") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'La Entrega se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/entregas?page=1';
      });
    } catch (error) {
      console.error('Error al actualizar la entrega:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la entrega. Intenta de nuevo.'
      });
    }

  }

  onPdfSelectedOficioFisico(event: Event, id_entrega: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.solicitudesService.uploadPdfOficioFisico(id_entrega, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/entregas?page=1';
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

  onPdfSelectedOficioAdministrativo(event: Event, id_entrega: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.solicitudesService.uploadPdfOficioAdministrativo(id_entrega, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/entregas?page=1';
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

  onPdfSelectedActaFisica(event: Event, id_entrega: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.solicitudesService.uploadPdfActaFisica(id_entrega, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/entregas?page=1';
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

  onPdfSelectedActaAdministrativa(event: Event, id_entrega: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.solicitudesService.uploadPdfActaAdministrativa(id_entrega, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/entregas?page=1';
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

  verPdfOficioFisico(id_entrega: number) {
    this.solicitudesService.getPdfOficioFisico(id_entrega).subscribe({
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

  verPdfOficioAdministrativo(id_entrega: number) {
    this.solicitudesService.getPdfOficioAdministrativo(id_entrega).subscribe({
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

  verPdfActaFisica(id_entrega: number) {
    this.solicitudesService.getPdfActaFisica(id_entrega).subscribe({
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

  verPdfActaAdministrativa(id_entrega: number) {
    this.solicitudesService.getPdfActaAdministrativa(id_entrega).subscribe({
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
