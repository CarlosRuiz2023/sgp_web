import { NgIf } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';
import { firstValueFrom } from 'rxjs';
import { EntregaTableComponent } from 'src/app/entregas/components/entrega-table/entrega-table.component';
import { Entrega } from 'src/app/entregas/interfaces/entrega.interface';
import { EntregasService } from 'src/app/entregas/services/entregas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'entrega-page',
  imports: [PaginationComponent, EntregaTableComponent, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './entrega-page.component.html',
})
export class EntregaPageComponent {
  selectedFile: File | null = null;
  entrega = input.required<Entrega>();
  entregasService = inject(EntregasService);
  totalPaginas = signal(0);
  entregas = signal<Entrega[]>([]);
  paginationService = inject(PaginationService);
  entregasPerPage = signal(10);
  obras = signal<any[]>([]);
  fisicos = signal<any[]>([]);
  administrativos = signal<any[]>([]);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  entregaForm = this.fb.group({
    id_obra: ['', Validators.required],
    id_usuario_fisico: ['', Validators.required],
    id_usuario_administrativo: ['', Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_entrega', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.entregasService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.entregasService.getUsuariosFisicos().subscribe({
      next: (resp: UsuariosResponse) => {
        this.fisicos.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.entregasService.getUsuariosAdministrativos().subscribe({
      next: (resp: UsuariosResponse) => {
        this.administrativos.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    // carga inicial de obras si quieres
    //this.loadObras(0, this.obrasPerPage());
  }

  paginationEffect = effect(() => {
    const page = this.paginationService.currentPage(); // signal del PaginationService
    const offset = (page - 1) * this.entregasPerPage();
    this.loadEntregas(offset, this.entregasPerPage());
  });

  loadEntregas(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    this.entregasService.getEntregas({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp) => {
        this.entregas.set(resp.data.entregas);
        this.totalPaginas.set(resp.data.totalPaginas);
      },
      error: (err) => console.error('Error al cargar entregas:', err),
    });
  }

  async onSubmit() {
    const isValid = this.entregaForm.valid;
    this.entregaForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.entregaForm.value;

    const entregaLike: Partial<Entrega> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.entregasService.createEntrega(entregaLike));
      // cerrar modal
      (document.getElementById("agregar_entrega_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'La Entrega se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        this.loadEntregas(0, this.entregasPerPage());
      });
    } catch (error) {
      console.error("Error al guardar entrega:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadEntregas(0, this.entregasPerPage());
  }

  clearSearch() {
    this.searchForm.reset({
      filtro: 'id_entrega',
      busqueda: ''
    });

    this.filters.set({});
    this.loadEntregas(0, this.entregasPerPage()); // recargar resultados
  }
}
