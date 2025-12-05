import { Routes } from "@angular/router";
import { StoreFrontLayoutComponent } from "./layouts/store-front-layout/store-front-layout.component";
import { ObraPageComponent } from "./pages/obra-page/obra-page.component";
import { NotFoundPageComponent } from "./pages/not-found-page/not-found-page.component";
import { UsuarioPageComponent } from "./pages/usuario-page/usuario-page.component";
import { ComitePageComponent } from "./pages/comite-page/comite-page.component";
import { EstimacionPageComponent } from "./pages/estimacion-page/estimacion-page.component";
import { ContratoPageComponent } from "./pages/contrato-page/contrato-page.component";
import { SolicitudPageComponent } from "./pages/solicitud-page/solicitud-page.component";
import { OficioSapalPageComponent } from "./pages/oficio-sapal-page/oficio-sapal-page.component";
import { EntregaPageComponent } from "./pages/entrega-page/entrega-page.component";
import { FirmaPageComponent } from "./pages/firma-page/firma-page.component";
import { PermissionGuard } from "@auth/guards/permission.guard";

export const storeFrontRoutes: Routes = [
    {
        path: '',
        component: StoreFrontLayoutComponent,
        children: [
            {
                path: '',
                component: ObraPageComponent,
                /* canMatch: [PermissionGuard],
                data: { modulo: 'Obras' , permiso: 'Consultar' } */
            },
            {
                path: 'obras',
                component: ObraPageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Obras' , permiso: 'Consultar' }
            },
            {
                path: 'usuarios',
                component: UsuarioPageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Usuarios' , permiso: 'Consultar' }
            },
            {
                path: 'comites',
                component: ComitePageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Comites' , permiso: 'Consultar' }
            },
            {
                path: 'estimaciones',
                component: EstimacionPageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Estimaciones' , permiso: 'Consultar' }
            },
            {
                path: 'contratos',
                component: ContratoPageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Contratos' , permiso: 'Consultar' }
            },
            {
                path: 'solicitudes',
                component: SolicitudPageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Solicitudes' , permiso: 'Consultar' }
            },
            {
                path: 'oficios-sapal',
                component: OficioSapalPageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Oficios-Sapal' , permiso: 'Consultar' }
            },
            {
                path: 'entregas',
                component: EntregaPageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Entregas' , permiso: 'Consultar' }
            },
            {
                path: 'firmas',
                component: FirmaPageComponent,
                canMatch: [PermissionGuard],
                data: { modulo: 'Firmas' , permiso: 'Consultar' }
            },
            {
                path: '**',
                component: NotFoundPageComponent
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
]
export default storeFrontRoutes;