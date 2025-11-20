import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ComiteTableComponent } from '@comites/components/comite-table/comite-table.component';
import { ComitesService } from '@comites/services/comite.service';
import { Comite } from '@comites/interfaces/comite.interface';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { Obra, ObrasResponse } from '@obras/interfaces/obra.interface';

@Component({
  selector: 'obra-page',
  imports: [PaginationComponent, ComiteTableComponent, ReactiveFormsModule, FormErrorLabelComponent,],
  templateUrl: './comite-page.component.html',
})
export class ComitePageComponent {
  comite = input.required<Comite>();
  comitesService = inject(ComitesService);
  totalPaginas = signal(0);
  comites = signal<Comite[]>([]);
  obras = signal<Obra[]>([]);
  paginationService = inject(PaginationService);
  comitesPerPage = signal(10);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  comiteForm = this.fb.group({
    id_obra: ['', Validators.required],
    tipo: ['', Validators.required],
    punto: ['', Validators.required],
    costo: ['', Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_comite', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.comitesService.getObras().subscribe({
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
    const offset = (page - 1) * this.comitesPerPage();
    this.loadComites(offset, this.comitesPerPage());
  });

  loadComites(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    console.log("Cargando obras con:", { offset, limit, filtro, busqueda });
    this.comitesService.getComites({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp) => {
        this.comites.set(resp.data.comites);
        this.totalPaginas.set(resp.data.totalPaginas);
      },
      error: (err) => console.error('Error al cargar obras:', err),
    });
  }

  async onSubmit() {
    const isValid = this.comiteForm.valid;
    this.comiteForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.comiteForm.value;

    const comiteLike: Partial<Comite> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.comitesService.createComite(comiteLike));
      // cerrar modal
      (document.getElementById("agregar_comite_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'El comite se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/comites?page=1';
      });
    } catch (error) {
      console.error("Error al guardar comite:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadComites(0, this.comitesPerPage());
  }

}
