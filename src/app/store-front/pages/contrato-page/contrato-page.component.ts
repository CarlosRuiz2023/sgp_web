import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ContratoTableComponent } from '@contratos/components/contrato-table/contrato-table.component';
import { Contrato } from '@contratos/interfaces/contrato.interface';
import { ContratoService } from '@contratos/services/contrato.service';
//import { ProductCardComponent } from '@obras/components/product-card/product-card.component';
import { ObrasResponse } from '@obras/interfaces/obra.interface';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { UsuariosResponse } from '@usuarios/interfaces/usuario.interface';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'obra-page',
  imports: [PaginationComponent, ContratoTableComponent, ReactiveFormsModule, FormErrorLabelComponent,],
  templateUrl: './contrato-page.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // 👈 IMPORTANTE
})
export class ContratoPageComponent {
  contrato = input.required<Contrato>();
  contratoService = inject(ContratoService);
  totalPaginas = signal(0);
  contratos = signal<Contrato[]>([]);
  paginationService = inject(PaginationService);
  contratosPerPage = signal(10);
  obras = signal<any[]>([]);
  supervisores = signal<any[]>([]);
  contratistas = signal<any[]>([]);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  contratoForm = this.fb.group({
    id_usuario_contratista: [0, Validators.required],
    id_usuario_supervisor: [0, Validators.required],
    id_usuario: [0, Validators.required],
    id_obra: [0, Validators.required],
    costo_real: [0, Validators.required],
    fecha_inicio: ['2025-01-01', Validators.required],
    fecha_termino: ['2025-01-01', Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_contrato', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.contratoService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.contratoService.getUsuariosContratistas().subscribe({
      next: (resp: UsuariosResponse) => {
        this.contratistas.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.contratoService.getUsuariosSupervisores().subscribe({
      next: (resp: UsuariosResponse) => {
        this.supervisores.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });

    // carga inicial de obras si quieres
    //this.loadObras(0, this.obrasPerPage());
  }

  paginationEffect = effect(() => {
    const page = this.paginationService.currentPage(); // signal del PaginationService
    const offset = (page - 1) * this.contratosPerPage();
    this.loadContratos(offset, this.contratosPerPage());
  });

  loadContratos(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    console.log("Cargando obras con:", { offset, limit, filtro, busqueda });
    this.contratoService.getContratos({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp) => {
        this.contratos.set(resp.data.contratos);
        this.totalPaginas.set(resp.data.totalPaginas);
      },
      error: (err) => console.error('Error al cargar contratos:', err),
    });
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
      await firstValueFrom(this.contratoService.createContrato(contratoLike));
      // cerrar modal
      (document.getElementById("agregar_contrato_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'El contrato se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/contratos?page=1';
      });
    } catch (error) {
      console.error("Error al guardar contrato:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadContratos(0, this.contratosPerPage());
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
