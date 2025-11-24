import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { FirmasService } from '../../services/firmas.service';
import { Firma } from '../../interfaces/firma.interface';
import { Usuario } from '@usuarios/interfaces/usuario.interface';

@Component({
  selector: 'firma-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './firma-table.component.html',
})
export class FirmaTableComponent {
  private firmasService = inject(FirmasService);
  fb = inject(FormBuilder);
  obras = signal<any[]>([]);

  firmas = input.required<Firma[]>();
  firmadores = input.required<Usuario[]>();

  firmaForm = this.fb.group({
    id_obra: [0, Validators.required],
    id_usuario: [0, Validators.required]
  });
  id_firma = 0;

  openEditModal(firma: Firma) {
    this.id_firma = firma.id_firma;
    // Poblamos el formulario con los valores de la obra
    this.firmaForm.patchValue({
      id_obra: firma.id_obra,
      id_usuario: firma.id_usuario,
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_firma_model') as HTMLDialogElement;
    modal?.showModal();
  }

  ngOnInit(): void {
    this.firmasService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
  }

  // Output para notificar al componente padre sobre cambios
  onFirmaDeleted = output<string>();
  onFirmaUpdated = output<Firma>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  /* editEstimacion(estimacionId: number) {
    this.router.navigate(['/admin/products', estimacionId]);
  } */

  deleteFirma(firmaId: number, firmaNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la firma ${firmaId} de la obra ${firmaNombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = firmaId.toString();
        this.deletingIds.add(id);

        this.firmasService.deleteFirma(id).subscribe({
          next: (success) => {
            if (success) {
              this.onFirmaDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Firma eliminada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/firmas?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar la firma:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la firma. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarFirma(firmaId: number, firmaNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se reactivara la firma ${firmaId} de la obra ${firmaNombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = firmaId.toString();
        this.deletingIds.add(id);

        this.firmasService.reactivarFirma(id).subscribe({
          next: (success) => {
            if (success) {
              this.onFirmaDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Firma reactivada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/firmas?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar la firma:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar la firma. Intenta de nuevo.'
            });
          }
        });
      }
    });
  }


  isDeleting(firmaId: number): boolean {
    return this.deletingIds.has(firmaId.toString());
  }

  async onSubmit() {
    const isValid = this.firmaForm.valid;
    this.firmaForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.firmaForm.value;

    const firmaLike: Partial<Firma> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.firmasService.updateFirma("" + this.id_firma, firmaLike));

      // cerrar modal
      (document.getElementById("editar_firma_model") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'La Firma se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/firmas?page=1';
      });
    } catch (error) {
      console.error('Error al actualizar la firma:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la firma. Intenta de nuevo.'
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
      this.firmasService.uploadPdf(id_obra, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/firmas?page=1';
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

  verPdf(id_firma: number) {
    this.firmasService.getPdf(id_firma).subscribe({
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
