import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
//import { ProductCarouselComponent } from '@obras/components/product-carousel/product-carousel.component';
import { firstValueFrom } from 'rxjs';

import { Obra } from '@obras/interfaces/obra.interface';
import { FormUtils } from '@utils/form-utils';
import { ObrasService } from '@obras/services/obras.service';

import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { Router } from '@angular/router';
import { ColoniasResponse } from '@obras/interfaces/colonia.interface';

@Component({
  selector: 'product-details',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent,
  ],
  templateUrl: './obra-details.component.html',
})
export class ObraDetailsComponent implements OnInit {
  obra = input.required<Obra>();

  router = inject(Router);
  fb = inject(FormBuilder);

  obrasService = inject(ObrasService);
  wasSaved = signal(false);

  imageFileList: FileList | undefined = undefined;
  tempImages = signal<string[]>([]);
  colonias = signal<any[]>([]);

  /* imagesToCarousel = computed(() => {
    const currentProductImages = [
      ...this.obra().calle,
      ...this.tempImages(),
    ];
    return currentProductImages;
  }); */

  productForm = this.fb.group({
    calle: ['', Validators.required],
    colonia: ['', Validators.required],
    tramo: ['', Validators.required],
  });

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  ngOnInit(): void {
    this.setFormValue(this.obra());
    this.obrasService.getColonias().subscribe({
      next: (resp: ColoniasResponse) => {
        this.colonias.set(resp.data.colonias.rows); // ajusta según tu estructura
      },
      error: (err) => console.error(err)
    });
  }

  setFormValue(formLike: Partial<Obra>) {
    this.productForm.reset(this.obra() as any);
    // this.productForm.patchValue({ tags: formLike.tags?.join(',') });
    this.productForm.patchValue(formLike as any);
  }

  /* onSizeClicked(size: string) {
    const currentSizes = this.productForm.value.sizes ?? [];

    if (currentSizes.includes(size)) {
      currentSizes.splice(currentSizes.indexOf(size), 1);
    } else {
      currentSizes.push(size);
    }

    this.productForm.patchValue({ sizes: currentSizes });
  } */

  async onSubmit() {
    const isValid = this.productForm.valid;
    this.productForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.productForm.value;

    const productLike: Partial<Obra> = {
      ...(formValue as any),
      /* tags:
        formValue.tags
          ?.toLowerCase()
          .split(',')
          .map((tag) => tag.trim()) ?? [], */
    };
    console.log(productLike);

    /* if (this.obra().calle === 'new') {
      // Crear producto
      const product = await firstValueFrom(
        this.obrasService.createProduct(productLike)
      );

      this.router.navigate(['/admin/products', product.id_obra]);
    } else {
      await firstValueFrom(
        this.obrasService.updateObra(
          this.obra().calle,
          productLike,
          this.imageFileList
        )
      );
    } */

    this.wasSaved.set(true);
    setTimeout(() => {
      this.wasSaved.set(false);
    }, 3000);
  }

  // Images
  onFilesChanged(event: Event) {
    const fileList = (event.target as HTMLInputElement).files;
    this.imageFileList = fileList ?? undefined;

    const imageUrls = Array.from(fileList ?? []).map((file) =>
      URL.createObjectURL(file)
    );

    this.tempImages.set(imageUrls);
  }
}
