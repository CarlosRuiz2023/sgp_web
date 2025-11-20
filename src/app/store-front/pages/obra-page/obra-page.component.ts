import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
//import { ProductCardComponent } from '@obras/components/product-card/product-card.component';
import { ObraTableComponent } from '@obras/components/obra-table/obra-table.component';
import { Obra } from '@obras/interfaces/obra.interface';
import { ObrasService } from '@obras/services/obras.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { ColoniasResponse } from '@shared/interfaces/colonia.interface';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'obra-page',
  imports: [PaginationComponent, ObraTableComponent, ReactiveFormsModule, FormErrorLabelComponent,],
  templateUrl: './obra-page.component.html',
})
export class ObraPageComponent {
  obra = input.required<Obra>();
  obrasService = inject(ObrasService);
  totalPaginas = signal(0);
  obras = signal<Obra[]>([]);
  paginationService = inject(PaginationService);
  obrasPerPage = signal(10);
  colonias = signal<any[]>([]);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  obraForm = this.fb.group({
    calle: ['', Validators.required],
    id_colonia: ['', Validators.required],
    tramo: ['', Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_obra', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.obrasService.getColonias().subscribe({
      next: (resp: ColoniasResponse) => {
        this.colonias.set(resp.data.colonias.rows); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });

    // carga inicial de obras si quieres
    //this.loadObras(0, this.obrasPerPage());
  }

  paginationEffect = effect(() => {
    const page = this.paginationService.currentPage(); // signal del PaginationService
    const offset = (page - 1) * this.obrasPerPage();
    this.loadObras(offset, this.obrasPerPage());
  });

  loadObras(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    console.log("Cargando obras con:", { offset, limit, filtro, busqueda });
    this.obrasService.getObras({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp) => {
        this.obras.set(resp.data.obras);
        this.totalPaginas.set(resp.data.totalPaginas);
      },
      error: (err) => console.error('Error al cargar obras:', err),
    });
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
      await firstValueFrom(this.obrasService.createObra(obraLike));
      // cerrar modal
      (document.getElementById("agregar_obra_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'La Obra se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/?page=1';
      });
    } catch (error) {
      console.error("Error al guardar obra:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadObras(0, this.obrasPerPage());
  }

}
