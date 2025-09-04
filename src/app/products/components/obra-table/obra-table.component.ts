import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ColoniasResponse } from '@products/interfaces/colonia.interface';
import { Obra } from '@products/interfaces/obra.interface';
import { ProductImagePipe } from '@products/pipes/product-image.pipe';
import { ObrasService } from '@products/services/products.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'product-table',
  imports: [ProductImagePipe, RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormErrorLabelComponent,],
  templateUrl: './obra-table.component.html',
})
export class ObraTableComponent {
  private obrasService = inject(ObrasService);
  private router = inject(Router);
  fb = inject(FormBuilder);
  colonias = signal<any[]>([]);

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
    const modal = document.getElementById('my_modal_2') as HTMLDialogElement;
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
    // Confirmar eliminación
    const confirmed = confirm(`¿Estás seguro de que deseas eliminar la obra "${obraNombre}"?`);

    if (!confirmed) return;

    const id = obraId.toString();
    this.deletingIds.add(id);

    this.obrasService.deleteObra(id).subscribe({
      next: (success) => {
        if (success) {
          console.log('Obra eliminada correctamente');
          // Notificar al componente padre
          this.onObraDeleted.emit(id);

          // Mostrar mensaje de éxito (opcional)
          alert('Obra eliminada correctamente');
        }
      },
      error: (error) => {
        console.error('Error al eliminar la obra:', error);
        alert('Error al eliminar la obra. Intenta de nuevo.');
      },
      complete: () => {
        this.deletingIds.delete(id);
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
      (document.getElementById("my_modal_2") as HTMLDialogElement)?.close();

      window.location.reload();
    } catch (error) {
      console.error("Error al guardar obra:", error);
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

      // Ejemplo: enviar a tu servicio
      // this.obrasService.uploadPdf(id_obra, file).subscribe(...);
    }
  }
}
