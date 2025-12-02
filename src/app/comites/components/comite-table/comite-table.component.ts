import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { Comite } from '@comites/interfaces/comite.interface';
import { ComitesService } from '@comites/services/comite.service';
import { Obra, ObrasResponse } from '@obras/interfaces/obra.interface';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'comite-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './comite-table.component.html',
})
export class ComiteTableComponent {
  private ComitesService = inject(ComitesService);
  private router = inject(Router);
  fb = inject(FormBuilder);
  obras = signal<any[]>([]);
  authService = inject(AuthService);

  comites = input.required<Comite[]>();

  comiteForm = this.fb.group({
    calle: ['', Validators.required],
    id_colonia: [0, Validators.required],
    tramo: ['', Validators.required],
  });
  id_obra = 0;

  openEditModal(obra: Obra) {
    this.id_obra = obra.id_obra;
    // Poblamos el formulario con los valores de la obra
    this.comiteForm.patchValue({
      calle: obra.calle,
      id_colonia: obra.id_colonia, // asegúrate de que tu interface tenga este campo
      tramo: obra.tramo,
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_obra_model') as HTMLDialogElement;
    modal?.showModal();
  }

  ngOnInit(): void {
    this.ComitesService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
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

        this.ComitesService.deleteComite(id).subscribe({
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
                window.location.href = '/comites?page=1';
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

        this.ComitesService.reactivarComite(id).subscribe({
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
                window.location.href = '/comites?page=1';
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

}
