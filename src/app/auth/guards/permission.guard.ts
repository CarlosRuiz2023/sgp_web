import { inject } from '@angular/core';
import { CanMatchFn, Route, Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';

export const PermissionGuard: CanMatchFn = async (route: Route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const required = route.data?.['permiso']; // permiso requerido (Consultar, Editar, etc)
  const modulo = route.data?.['modulo']; // permiso requerido (Consultar, Editar, etc)

  // Si la ruta no especifica permisos → permitir.
  if (!modulo || !required) return true;

  const tieneAcceso = authService.tienePermiso(modulo, required);

  if (!tieneAcceso) {
    // Si NO tiene acceso → redirigir al primer módulo accesible
    const primerModulo = authService.getPrimerModulo(authService.permisos());

    router.navigateByUrl('/' + (primerModulo ?? 'sin-permisos'));
    return false;
  }

  return true;
};
