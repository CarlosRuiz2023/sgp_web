import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EstimacionesService } from '@estimaciones/services/estimaciones.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { Estimacion } from '@estimaciones/interfaces/estimacion.interface';
import { ObrasResponse } from '@obras/interfaces/obra.interface';

@Component({
  selector: 'estimacion-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './estimacion-table.component.html',
})
export class EstimacionTableComponent {
  private estimacionesService = inject(EstimacionesService);
  private router = inject(Router);
  fb = inject(FormBuilder);
  obras = signal<any[]>([]);

  estimaciones = input.required<Estimacion[]>();

  estimacionForm = this.fb.group({
    id_obra: [0, Validators.required],
    finiquito: [false, Validators.required],
    avance_fisico: [0, Validators.required],
    avance_financiero: [0, Validators.required],
    actual: [0, Validators.required],
    anterior: [0, Validators.required],
  });
  id_estimacion = 0;

  openEditModal(estimacion: Estimacion) {
    this.id_estimacion = estimacion.id_estimacion;
    // Poblamos el formulario con los valores de la obra
    this.estimacionForm.patchValue({
      id_obra: estimacion.id_obra,
      finiquito: estimacion.finiquito,
      avance_fisico: estimacion.avance_fisico,
      avance_financiero: estimacion.avance_financiero,
      actual: estimacion.actual,
      anterior: estimacion.anterior,
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_estimacion_model') as HTMLDialogElement;
    modal?.showModal();
  }

  ngOnInit(): void {
    this.estimacionesService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
  }

  // Output para notificar al componente padre sobre cambios
  onEstimacionDeleted = output<string>();
  onEstimacionUpdated = output<Estimacion>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  /* editEstimacion(estimacionId: number) {
    this.router.navigate(['/admin/products', estimacionId]);
  } */

  deleteEstimacion(estimacionId: number, estimacionNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la estimacion ${estimacionId} de la obra ${estimacionNombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = estimacionId.toString();
        this.deletingIds.add(id);

        this.estimacionesService.deleteEstimacion(id).subscribe({
          next: (success) => {
            if (success) {
              this.onEstimacionDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Estimacion eliminada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/estimaciones?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar la estimacion:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la estimacion. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarEstimacion(estimacionId: number, estimacionNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se reactivara la estimacion ${estimacionId} de la obra ${estimacionNombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = estimacionId.toString();
        this.deletingIds.add(id);

        this.estimacionesService.reactivarEstimacion(id).subscribe({
          next: (success) => {
            if (success) {
              this.onEstimacionDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Estimacion reactivada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/estimaciones?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar la estimacion:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar la estimacion. Intenta de nuevo.'
            });
          }
        });
      }
    });
  }


  isDeleting(estimacionId: number): boolean {
    return this.deletingIds.has(estimacionId.toString());
  }

  async onSubmit() {
    const isValid = this.estimacionForm.valid;
    this.estimacionForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.estimacionForm.value;

    const estimacionLike: Partial<Estimacion> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.estimacionesService.updateEstimacion("" + this.id_estimacion, estimacionLike));

      // cerrar modal
      (document.getElementById("editar_estimacion_model") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'La Estimacion se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/estimaciones?page=1';
      });
    } catch (error) {
      console.error('Error al actualizar la estimacion:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la estimacion. Intenta de nuevo.'
      });
    }

  }

  onPdfSelected(event: Event, id_obra: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Llamamos al servicio
      this.estimacionesService.uploadPdf(id_obra, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/estimaciones?page=1';
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

  verPdf(id_estimacion: number) {
    this.estimacionesService.getPdf(id_estimacion).subscribe({
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
