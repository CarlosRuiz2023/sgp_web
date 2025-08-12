import { Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { ObrasService } from '@products/services/products.service';
import { ObraDetailsComponent } from './obra-details/obra-details.component';

@Component({
  selector: 'app-product-admin-page',
  imports: [ObraDetailsComponent],
  templateUrl: './product-admin-page.component.html',
})
export class ProductAdminPageComponent {
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  productService = inject(ObrasService);

  productId = toSignal(
    this.activatedRoute.params.pipe(map((params) => params['id']))
  );

  productResource = rxResource({
    request: () => ({ id: this.productId() }),
    loader: ({ request }) => {
      return this.productService.getProductById(request.id);
    },
  });

  redirectEffect = effect(() => {
    if (this.productResource.error()) {
      this.router.navigate(['/admin/products']);
    }
  });
}
