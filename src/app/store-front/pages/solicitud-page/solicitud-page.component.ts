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
import { SolicitudTableComponent } from 'src/app/solicitudes/components/solicitud-table/solicitud-table.component';
import { Solicitud } from 'src/app/solicitudes/interfaces/solicitud.interface';
import { SolicitudesService } from 'src/app/solicitudes/services/solicitudes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'solicitud-page',
  imports: [PaginationComponent, SolicitudTableComponent, ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './solicitud-page.component.html',
})
export class SolicitudPageComponent {
  selectedFile: File | null = null;
  solicitud = input.required<Solicitud>();
  solicitudesService = inject(SolicitudesService);
  totalPaginas = signal(0);
  solicitudes = signal<Solicitud[]>([]);
  paginationService = inject(PaginationService);
  solicitudesPerPage = signal(10);
  obras = signal<any[]>([]);
  laboratoristas = signal<any[]>([]);
  mecanicosDeSuelos = signal<any[]>([]);
  fb = inject(FormBuilder);
  wasSaved = signal(false);
  imageFileList: FileList | undefined = undefined;
  router = inject(Router);
  filters = signal<{ filtro?: string | null; busqueda?: string | null }>({});
  authService = inject(AuthService);

  solicitudForm = this.fb.group({
    id_obra: ['', Validators.required],
    id_usuario_laboratorio: [0, Validators.required],
    id_usuario_ms: [0, Validators.required],
  });

  searchForm = this.fb.group({
    filtro: ['id_solicitud', Validators.required],
    busqueda: ['', Validators.required],
  });

  ngOnInit(): void {
    this.solicitudesService.getObras().subscribe({
      next: (resp: ObrasResponse) => {
        this.obras.set(resp.data.obras); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.solicitudesService.getUsuariosLaboratoristas().subscribe({
      next: (resp: UsuariosResponse) => {
        this.laboratoristas.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    this.solicitudesService.getUsuariosMecanicosDeSuelos().subscribe({
      next: (resp: UsuariosResponse) => {
        this.mecanicosDeSuelos.set(resp.data.usuarios); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
    // carga inicial de obras si quieres
    //this.loadObras(0, this.obrasPerPage());
  }

  paginationEffect = effect(() => {
    const page = this.paginationService.currentPage(); // signal del PaginationService
    const offset = (page - 1) * this.solicitudesPerPage();
    this.loadSolicitudes(offset, this.solicitudesPerPage());
  });

  loadSolicitudes(offset: number = 0, limit: number = 10) {
    const { filtro, busqueda } = this.searchForm.value;
    this.solicitudesService.getSolicitudes({ limit, offset, filtro, busqueda }).subscribe({
      next: (resp) => {
        this.solicitudes.set(resp.data.solicitudes);
        this.totalPaginas.set(resp.data.totalPaginas);
      },
      error: (err) => console.error('Error al cargar obras:', err),
    });
  }

  async onSubmit() {
    const isValid = this.solicitudForm.valid;
    this.solicitudForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.solicitudForm.value;

    const solicitudLike: Partial<Solicitud> = {
      ...(formValue as any),
    };

    try {
      await firstValueFrom(this.solicitudesService.createSolicitud(solicitudLike, this.selectedFile!));
      // cerrar modal
      (document.getElementById("agregar_solicitud_modal") as HTMLDialogElement)?.close();
      // alerta bonita con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'La Solicitud se registró de forma exitosa',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        window.location.href = '/solicitudes?page=1';
      });
    } catch (error) {
      console.error("Error al guardar solicitud:", error);
    }

  }

  async onSearch() {
    if (this.searchForm.invalid) {
      alert("Por favor, complete los campos de búsqueda.");
      return;
    };

    const { filtro, busqueda } = this.searchForm.value;
    this.filters.set({ filtro, busqueda });
    this.loadSolicitudes(0, this.solicitudesPerPage());
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
}
