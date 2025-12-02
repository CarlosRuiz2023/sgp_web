import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { Obra } from '@obras/interfaces/obra.interface';
import { ObrasService } from '@obras/services/obras.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { ColoniasResponse } from '@shared/interfaces/colonia.interface';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'product-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './obra-table.component.html',
})
export class ObraTableComponent {
  private obrasService = inject(ObrasService);
  private router = inject(Router);
  fb = inject(FormBuilder);
  colonias = signal<any[]>([]);
  authService = inject(AuthService);

  obras = input.required<Obra[]>();

  obraForm = this.fb.group({
    calle: ['', Validators.required],
    id_colonia: [0, Validators.required],
    tramo: ['', Validators.required],
  });
  id_obra = 0;

  openEditModal(obra: Obra) {
    this.id_obra = obra.id_obra;
    // Poblamos el formulario con los valores de la obra
    this.obraForm.patchValue({
      calle: obra.calle,
      id_colonia: obra.id_colonia, // asegúrate de que tu interface tenga este campo
      tramo: obra.tramo,
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_obra_model') as HTMLDialogElement;
    modal?.showModal();
  }

  ngOnInit(): void {
    this.obrasService.getColonias().subscribe({
      next: (resp: ColoniasResponse) => {
        this.colonias.set(resp.data.colonias.rows); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
  }

  // Output para notificar al componente padre sobre cambios
  onObraDeleted = output<string>();
  onObraUpdated = output<Obra>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  editObra(obraId: number) {
    this.router.navigate(['/admin/products', obraId]);
  }

  deleteObra(obraId: number, obraNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la obra "${obraNombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = obraId.toString();
        this.deletingIds.add(id);

        this.obrasService.deleteObra(id).subscribe({
          next: (success) => {
            if (success) {
              this.onObraDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Obra eliminada correctamente',
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
            console.error('Error al eliminar la obra:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la obra. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarObra(obraId: number, obraNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se reactivara la obra "${obraNombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = obraId.toString();
        this.deletingIds.add(id);

        this.obrasService.reactivarObra(id).subscribe({
          next: (success) => {
            if (success) {
              this.onObraDeleted.emit(id);

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
    const isValid = this.obraForm.valid;
    this.obraForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.obraForm.value;

    const obraLike: Partial<Obra> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.obrasService.updateObra("" + this.id_obra, obraLike));

      // cerrar modal
      (document.getElementById("editar_obra_model") as HTMLDialogElement)?.close();

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

  onPdfSelected(event: Event, id_obra: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }

      // Aquí puedes subir el archivo al servidor
      console.log('PDF seleccionado para obra', id_obra, file);

      // Llamamos al servicio
      this.obrasService.uploadPdf(id_obra, file).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Se ha agregado el PDF de forma exitosa',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
          }).then(() => {
            // recargar la página después de cerrar el alert
            window.location.href = '/?page=1';
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

  verPdf(id_obra: number) {
    this.obrasService.getPdf(id_obra).subscribe({
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
