import { Component, computed, input } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Obra } from '@products/interfaces/obra.interface';
import { ProductImagePipe } from '@products/pipes/product-image.pipe';

@Component({
  selector: 'product-card',
  imports: [RouterLink, SlicePipe, ProductImagePipe],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  obra = input.required<Obra>();

  imageUrl = computed(() => {
    return `http://localhost:3000/api/files/product/${
      this.obra().calle
    }`;
  });
}
