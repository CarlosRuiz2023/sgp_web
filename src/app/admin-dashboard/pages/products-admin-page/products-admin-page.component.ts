import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ObrasService } from '@products/services/products.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';

import { ObraTableComponent } from '../../../products/components/obra-table/obra-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-products-admin-page',
  imports: [ObraTableComponent, PaginationComponent, RouterLink],
  templateUrl: './products-admin-page.component.html',
})
export class ProductsAdminPageComponent {
  obrasService = inject(ObrasService);
  paginationService = inject(PaginationService);

  obrasPerPage = signal(10);

  obrasResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage() - 1,
      limit: this.obrasPerPage(),
    }),
    loader: ({ request }) => {
      return this.obrasService.getObras({
        offset: request.page * 9,
        limit: request.limit,
      });
    },
  });
}
