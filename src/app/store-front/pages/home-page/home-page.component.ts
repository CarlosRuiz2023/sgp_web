import { Component, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
//import { ProductCardComponent } from '@products/components/product-card/product-card.component';
import { ObraTableComponent } from '@products/components/obra-table/obra-table.component';
import { ObrasService } from '@products/services/products.service';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';

@Component({
  selector: 'app-home-page',
  imports: [PaginationComponent, ObraTableComponent],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  obrasService = inject(ObrasService);
  paginationService = inject(PaginationService);
  obrasPerPage = signal(10);

  // activatedRoute = inject(ActivatedRoute);

  // currentPage = toSignal(
  //   this.activatedRoute.queryParamMap.pipe(
  //     map((params) => (params.get('page') ? +params.get('page')! : 1)),
  //     map((page) => (isNaN(page) ? 1 : page))
  //   ),
  //   {
  //     initialValue: 1,
  //   }
  // );

  obrasResource = rxResource({
    request: () => ({ page: this.paginationService.currentPage() - 1, limit: this.obrasPerPage(), }),
    loader: ({ request }) => {
      return this.obrasService.getObras({
        offset: request.page * 9,
        limit: request.limit,
      });
    },
  });
}
