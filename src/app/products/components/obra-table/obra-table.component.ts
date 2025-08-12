import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Obra } from '@products/interfaces/obra.interface';
import { ProductImagePipe } from '@products/pipes/product-image.pipe';

@Component({
  selector: 'product-table',
  imports: [ProductImagePipe, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './obra-table.component.html',
})
export class ObraTableComponent {
  obras = input.required<Obra[]>();
}
