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
import { OficioSapalTableComponent } from 'src/app/oficioSapal/components/oficioSapal-table/oficioSapal-table.component';
import { OficiosSapal } from 'src/app/oficioSapal/interfaces/oficioSapal.interface';
import { OficioSapalService } from 'src/app/oficioSapal/services/oficioSapal.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'oficio-sapal-page',
  imports: [PaginationComponent, OficioSapalTableComponent, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './oficio-sapal-page.component.html',
})
export class OficioSapalPageComponent {
  selectedFile: File | null = null;
  oficioSapal = input.required<OficiosSapal>();
  oficioSapalService = inject(OficioSapalService);
  totalPaginas = signal(0);
  oficiosSapal = signal<OficiosSapal[]>([]);
  paginationService = inject(PaginationService);
  oficiosSapalPerPage = signal(10);
  obras = signal<any[]>([]);
  sapaleros = signal<any[]>([]);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  oficioSapalForm = this.fb.group({
    id_obra: ['', Validators.required],
    id_usuario_sapal: ['', Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_oficio_sapal', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.oficioSapalService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.oficioSapalService.getUsuariosSapal().subscribe({
      next: (resp: UsuariosResponse) => {
        this.sapaleros.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    // carga inicial de obras si quieres
    //this.loadObras(0, this.obrasPerPage());
  }

  paginationEffect = effect(() => {
    const page = this.paginationService.currentPage(); // signal del PaginationService
    const offset = (page - 1) * this.oficiosSapalPerPage();
    this.loadOficiosSapal(offset, this.oficiosSapalPerPage());
  });

  loadOficiosSapal(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    this.oficioSapalService.getOficiosSapal({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp) => {
        this.oficiosSapal.set(resp.data.oficios_sapal);
        this.totalPaginas.set(resp.data.totalPaginas);
      },
      error: (err) => console.error('Error al cargar oficios de sapal:', err),
    });
  }

  async onSubmit() {
    const isValid = this.oficioSapalForm.valid;
    this.oficioSapalForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.oficioSapalForm.value;

    const oficioSapalLike: Partial<OficiosSapal> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.oficioSapalService.createOficioSapal(oficioSapalLike, this.selectedFile!));
      // cerrar modal
      (document.getElementById("agregar_oficio_sapal_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'El oficio sapal se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        this.loadOficiosSapal(0, this.oficiosSapalPerPage());
      });
    } catch (error) {
      console.error("Error al guardar oficio sapal:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadOficiosSapal(0, this.oficiosSapalPerPage());
  }

  onPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido.');
        return;
      }
      this.selectedFile = file;
      console.log("Archivo seleccionado:", this.selectedFile);
    }
  }

  clearSearch() {
    this.searchForm.reset({
      filtro: 'id_oficio_sapal',
      busqueda: ''
    });

    this.filters.set({});
    this.loadOficiosSapal(0, this.oficiosSapalPerPage()); // recargar resultados
  }
}
