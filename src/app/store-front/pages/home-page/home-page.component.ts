import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
//import { ProductCardComponent } from '@products/components/product-card/product-card.component';
import { ObraTableComponent } from '@products/components/obra-table/obra-table.component';
import { ColoniasResponse } from '@products/interfaces/colonia.interface';
import { Obra } from '@products/interfaces/obra.interface';
import { ObrasService } from '@products/services/products.service';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { firstValueFrom, map } from 'rxjs';

@Component({
  selector: 'app-home-page',
  imports: [PaginationComponent, ObraTableComponent, ReactiveFormsModule, FormErrorLabelComponent,],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
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

  /* imagesToCarousel = computed(() => {
    const currentProductImages = [
      ...this.obra().calle,
      ...this.tempImages(),
    ];
    return currentProductImages;
  }); */

  obraForm = this.fb.group({
    calle: ['', Validators.required],
    id_colonia: ['', Validators.required],
    tramo: ['', Validators.required],
  });

  ngOnInit(): void {
    this.obrasService.getColonias().subscribe({
      next: (resp: ColoniasResponse) => {
        this.colonias.set(resp.data.colonias.rows); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });

    this.obrasService.getObras({ limit: 10, offset: 0 })
      .subscribe({
        next: (resp) => {
          this.obras.set(resp.data.obras); // << actualiza el signal
          this.totalPaginas.set(resp.data.totalPaginas); // << actualiza el total
        },
        error: (err) => console.error('Error en búsqueda:', err)
      });
  }

  activatedRoute = inject(ActivatedRoute);

  currentPage = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map((params) => (params.get('page') ? +params.get('page')! : 1)),
      map((page) => (isNaN(page) ? 1 : page))
    ),
    {
      initialValue: 1,
    }
  );

  async onSubmit() {
    const isValid = this.obraForm.valid;
    this.obraForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.obraForm.value;

    const obraLike: Partial<Obra> = {
      ...(formValue as any),
    };

    try {
      const nuevaObra:any = await firstValueFrom(this.obrasService.createObra(obraLike));
      this.obras.update((prev) => [...prev, nuevaObra.data]); // agrega la nueva obra
      //await firstValueFrom(this.obrasService.createObra(obraLike));
      this.obraForm.reset();
      this.obraForm.markAsUntouched();
      this.wasSaved.set(true);
      // cerrar modal
      (document.getElementById("my_modal_1") as HTMLDialogElement)?.close();
      alert("Se3 registro la Obra de forma exitosa");
    } catch (error) {
      console.error("Error al guardar obra:", error);
    }

  }

  searchForm = this.fb.group({
    filtro: ['', Validators.required],
    busqueda: ['', Validators.required],
  });

  async onSearch() {
    if (this.searchForm.invalid) return;

    const { filtro, busqueda } = this.searchForm.value;
    this.obrasService.getObras({ limit: 10, offset: 0, filtro, busqueda })
      .subscribe({
        next: (resp) => {
          this.obras.set(resp.data.obras); // << actualiza el signal
          this.totalPaginas.set(resp.data.totalPaginas); // << actualiza el total
        },
        error: (err) => console.error('Error en búsqueda:', err)
      });
  }

}
