import { CurrencyPipe, DatePipe, NgClass, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import { Comite } from '@comites/interfaces/comite.interface';
import { ComitesService } from '@comites/services/comite.service';
import { Obra, ObrasResponse } from '@obras/interfaces/obra.interface';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'comite-table',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf, NgClass],
  templateUrl: './comite-table.component.html',
})
export class ComiteTableComponent {
  private ComitesService = inject(ComitesService);
  fb = inject(FormBuilder);
  obras = signal<any[]>([]);
  authService = inject(AuthService);
  loadComites = output<void>();

  comites = input.required<Comite[]>();

  comiteForm = this.fb.group({
    calle: ['', Validators.required],
    id_colonia: [0, Validators.required],
    tramo: ['', Validators.required],
  });
  id_obra = 0;

  ngOnInit(): void {
    this.ComitesService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
  }

  // Output para notificar al componente padre sobre cambios
  onComiteDeleted = output<string>();
  onComiteUpdated = output<Obra>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  deleteComite(comiteId: number, comiteNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el comite de la obra "${comiteNombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = comiteId.toString();
        this.deletingIds.add(id);

        this.ComitesService.deleteComite(id).subscribe({
          next: (success) => {
            if (success) {
              this.onComiteDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Comite eliminado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                this.loadComites.emit();
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar el comite:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el comite. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarComite(comiteId: number, comiteNombre: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se reactivara el comite de la obra "${comiteNombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = comiteId.toString();
        this.deletingIds.add(id);

        this.ComitesService.reactivarComite(id).subscribe({
          next: (success) => {
            if (success) {
              this.onComiteDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Comite reactivado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                this.loadComites.emit();
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar el comite:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar el comite. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  isDeleting(obraId: number): boolean {
    return this.deletingIds.has(obraId.toString());
  }

  getColorClase(estatus: number) {
    return {
      0: 'bg-error/30',
      1: 'bg-base-300',
    }[estatus] || '';
  }

}
