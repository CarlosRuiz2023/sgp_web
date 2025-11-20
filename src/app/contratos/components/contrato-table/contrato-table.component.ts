import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, input, output, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Contrato } from '@contratos/interfaces/contrato.interface';
import { ContratoService } from '@contratos/services/contrato.service';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'contrato-table',
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './contrato-table.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // 👈 IMPORTANTE
})
export class ContratoTableComponent {
  private ContratoService = inject(ContratoService);
  fb = inject(FormBuilder);
  obras = signal<any[]>([]);
  supervisores = signal<any[]>([]);
  contratistas = signal<any[]>([]);

  contratos = input.required<Contrato[]>();

  contratoForm = this.fb.group({
    id_usuario_contratista: [0, Validators.required],
    id_usuario_supervisor: [0, Validators.required],
    id_obra: [0, Validators.required],
    costo_real: [0, Validators.required],
    fecha_inicio: ['2025-01-01', Validators.required],
    fecha_termino: ['2025-01-01', Validators.required],
  });
  id_contrato = 0;

  openEditModal(contrato: Contrato) {
    this.id_contrato = contrato.id_contrato;
    // Poblamos el formulario con los valores de la obra
    this.contratoForm.patchValue({
      id_usuario_contratista: contrato.id_usuario_contratista,
      id_usuario_supervisor: contrato.id_usuario_supervisor,
      id_obra: contrato.id_obra,
      costo_real: contrato.costo_real,
      fecha_inicio: new Date(contrato.fecha_inicio).toISOString().split('T')[0],
      fecha_termino: new Date(contrato.fecha_termino).toISOString().split('T')[0],
    });

    // Abrimos el modal con JS nativo
    const modal = document.getElementById('editar_contrato_model') as HTMLDialogElement;
    modal?.showModal();
  }

  ngOnInit(): void {
    this.ContratoService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.ContratoService.getUsuariosSupervisores().subscribe({
      next: (resp: UsuariosResponse) => {
        this.supervisores.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.ContratoService.getUsuariosContratistas().subscribe({
      next: (resp: UsuariosResponse) => {
        this.contratistas.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
  }

  // Output para notificar al componente padre sobre cambios
  onContratoDeleted = output<string>();
  onContratoUpdated = output<Contrato>();

  // Estado para manejar operaciones en progreso
  deletingIds = new Set<string>();

  deleteContrato(contratoId: number, obraNombre: string) {
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
        const id = contratoId.toString();
        this.deletingIds.add(id);

        this.ContratoService.deleteContrato(id).subscribe({
          next: (success) => {
            if (success) {
              this.onContratoDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Contrato eliminado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/contratos?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar el contrato:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el contrato. Intenta de nuevo.'
            });
          },
          complete: () => {
            this.deletingIds.delete(id);
          }
        });
      }
    });
  }

  reactivarContrato(contratoId: number, obraNombre: string) {
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
        const id = contratoId.toString();
        this.deletingIds.add(id);

        this.ContratoService.reactivarContrato(id).subscribe({
          next: (success) => {
            if (success) {
              this.onContratoDeleted.emit(id);

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Contrato reactivado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              }).then(() => {
                // recargar la página después de cerrar el alert
                window.location.href = '/contratos?page=1';
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar el contrato:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo reactivar el contrato. Intenta de nuevo.'
            });
          }
        });
      }
    });
  }


  isDeleting(contratoId: number): boolean {
    return this.deletingIds.has(contratoId.toString());
  }

  async onSubmit() {
    const isValid = this.contratoForm.valid;
    this.contratoForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.contratoForm.value;

    const contratoLike: Partial<Contrato> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.ContratoService.updateContrato("" + this.id_contrato, contratoLike));

      // cerrar modal
      (document.getElementById("editar_contrato_model") as HTMLDialogElement)?.close();

      Swal.fire({
        title: '¡Éxito!',
        text: 'El contrato se actualizo de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/contratos?page=1';
      });
    } catch (error) {
      console.error('Error al actualizar el contrato:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el contrato. Intenta de nuevo.'
      });
    }

  }

  onFechaInicioChange(event: any) {
    const selectedDate = event.target.value; // El formato que emite Cally (ej. '2025-10-09')
    this.contratoForm.patchValue({ fecha_inicio: selectedDate });
  }
  onFechaTerminoChange(event: any) {
    const selectedDate = event.target.value; // El formato que emite Cally (ej. '2025-10-09')
    this.contratoForm.patchValue({ fecha_termino: selectedDate });
  }
}
