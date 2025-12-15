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
import { FirmaTableComponent } from 'src/app/firmas/components/firma-table/firma-table.component';
import { Firma } from 'src/app/firmas/interfaces/firma.interface';
import { FirmasService } from 'src/app/firmas/services/firmas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'firma-page',
  imports: [PaginationComponent, FirmaTableComponent, ReactiveFormsModule, FormErrorLabelComponent, NgIf],
  templateUrl: './firma-page.component.html',
})
export class FirmaPageComponent {
  firma = input.required<Firma>();
  firmasService = inject(FirmasService);
  totalPaginas = signal(0);
  firmas = signal<Firma[]>([]);
  paginationService = inject(PaginationService);
  firmasPerPage = signal(10);
  obras = signal<any[]>([]);
  firmadores = signal<any[]>([]);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  firmaForm = this.fb.group({
    id_obra: ['', Validators.required],
    id_usuario: ['', Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_firma', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.firmasService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        const obrasActivas = resp.data.obras.filter(
          (obra: any) => obra.estatus === 1
        );
        this.obras.set(obrasActivas);
      },
      error: (err) => console.error(err)
    });
    this.firmasService.getUsuariosFirmadores().subscribe({
      next: (resp: UsuariosResponse) => {
        const firmadoresActivos = resp.data.usuarios.filter(
          (usuario: any) => usuario.estatus === 1
        );
        this.firmadores.set(firmadoresActivos);
      },
      error: (err) => console.error(err)
    });
  }

  paginationEffect = effect(() => {
    const page = this.paginationService.currentPage(); // signal del PaginationService
    const offset = (page - 1) * this.firmasPerPage();
    this.loadFirmas(offset, this.firmasPerPage());
  });

  loadFirmas(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    this.firmasService.getFirmas({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp) => {
        if (this.authService.isAdmin()) {
          this.firmas.set(resp.data.firmas);
          this.totalPaginas.set(resp.data.totalPaginas);
        } else {
          const firmasActivas = resp.data.firmas.filter((firma: Firma) => firma.estatus != 0);
          this.firmas.set(firmasActivas);
          this.totalPaginas.set(Math.ceil(firmasActivas.length / limit));
        }
      },
      error: (err) => console.error('Error al cargar firmas:', err),
    });
  }

  async onSubmit() {
    const isValid = this.firmaForm.valid;
    this.firmaForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.firmaForm.value;

    const firmaLike: Partial<Firma> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.firmasService.createFirma(firmaLike));
      // cerrar modal
      (document.getElementById("agregar_firma_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'La Firma se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        this.loadFirmas(0, this.firmasPerPage());
      });
    } catch (error) {
      console.error("Error al guardar firma:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadFirmas(0, this.firmasPerPage());
  }

  clearSearch() {
    this.searchForm.reset({
      filtro: 'id_firma',
      busqueda: ''
    });

    this.filters.set({});
    this.loadFirmas(0, this.firmasPerPage()); // recargar resultados
  }

}
