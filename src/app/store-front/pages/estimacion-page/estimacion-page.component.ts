import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
//import { ProductCardComponent } from '@obras/components/product-card/product-card.component';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { firstValueFrom } from 'rxjs';
import { EstimacionTableComponent } from 'src/app/estimaciones/components/estimacion-table/estimacion-table.component';
import { Estimacion } from 'src/app/estimaciones/interfaces/estimacion.interface';
import { EstimacionesService } from 'src/app/estimaciones/services/estimaciones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'estimacion-page',
  imports: [PaginationComponent, EstimacionTableComponent, ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './estimacion-page.component.html',
})
export class EstimacionPageComponent {
  estimacion = input.required<Estimacion>();
  estimacionesService = inject(EstimacionesService);
  totalPaginas = signal(0);
  estimaciones = signal<Estimacion[]>([]);
  paginationService = inject(PaginationService);
  estimacionesPerPage = signal(10);
  obras = signal<any[]>([]);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  estimacionForm = this.fb.group({
    id_obra: ['', Validators.required],
    finiquito: [false, Validators.required],
    avance_fisico: [0, Validators.required],
    avance_financiero: [0, Validators.required],
    actual: [0, Validators.required],
    anterior: [0, Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_estimacion', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.estimacionesService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });

    // carga inicial de obras si quieres
    //this.loadObras(0, this.obrasPerPage());
  }

  paginationEffect = effect(() => {
    const page = this.paginationService.currentPage(); // signal del PaginationService
    const offset = (page - 1) * this.estimacionesPerPage();
    this.loadEstimaciones(offset, this.estimacionesPerPage());
  });

  loadEstimaciones(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    this.estimacionesService.getEstimaciones({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp) => {
        this.estimaciones.set(resp.data.estimaciones);
        this.totalPaginas.set(resp.data.totalPaginas);
      },
      error: (err) => console.error('Error al cargar obras:', err),
    });
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
      await firstValueFrom(this.estimacionesService.createEstimacion(estimacionLike));
      // cerrar modal
      (document.getElementById("agregar_estimacion_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'La Estimacion se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/estimaciones?page=1';
      });
    } catch (error) {
      console.error("Error al guardar estimacion:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadEstimaciones(0, this.estimacionesPerPage());
  }

}
