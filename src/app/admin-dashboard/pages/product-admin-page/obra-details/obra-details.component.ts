import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
//import { ProductCarouselComponent } from '@products/components/product-carousel/product-carousel.component';
import { firstValueFrom } from 'rxjs';

import { Obra } from '@products/interfaces/obra.interface';
import { FormUtils } from '@utils/form-utils';
import { ObrasService } from '@products/services/products.service';

import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { Router } from '@angular/router';

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

  /* imagesToCarousel = computed(() => {
    const currentProductImages = [
      ...this.obra().calle,
      ...this.tempImages(),
    ];
    return currentProductImages;
  }); */

  productForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    slug: [
      '',
      [Validators.required, Validators.pattern(FormUtils.slugPattern)],
    ],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    sizes: [['']],
    images: [[]],
    tags: [''],
    gender: [
      'men',
      [Validators.required, Validators.pattern(/men|women|kid|unisex/)],
    ],
  });

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  ngOnInit(): void {
    this.setFormValue(this.obra());
  }

  setFormValue(formLike: Partial<Obra>) {
    this.productForm.reset(this.obra() as any);
    // this.productForm.patchValue({ tags: formLike.tags?.join(',') });
    this.productForm.patchValue(formLike as any);
  }

  onSizeClicked(size: string) {
    const currentSizes = this.productForm.value.sizes ?? [];

    if (currentSizes.includes(size)) {
      currentSizes.splice(currentSizes.indexOf(size), 1);
    } else {
      currentSizes.push(size);
    }

    this.productForm.patchValue({ sizes: currentSizes });
  }

  async onSubmit() {
    const isValid = this.productForm.valid;
    this.productForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.productForm.value;

    const productLike: Partial<Obra> = {
      ...(formValue as any),
      tags:
        formValue.tags
          ?.toLowerCase()
          .split(',')
          .map((tag) => tag.trim()) ?? [],
    };

    if (this.obra().calle === 'new') {
      // Crear producto
      const product = await firstValueFrom(
        this.obrasService.createProduct(productLike, this.imageFileList)
      );

      this.router.navigate(['/admin/products', product.id_obra]);
    } else {
      await firstValueFrom(
        this.obrasService.updateProduct(
          this.obra().calle,
          productLike,
          this.imageFileList
        )
      );
    }

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
