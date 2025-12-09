import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaginationService {
  private activatedRoute = inject(ActivatedRoute);

  currentPage = signal(1);

  constructor() {
    this.activatedRoute.queryParamMap.subscribe((params) => {
      const page = +(params.get('page') || 1);
      this.currentPage.set(isNaN(page) ? 1 : page);
    });
  }

  setPage(page: number) {
    this.currentPage.set(page);
  }
}
