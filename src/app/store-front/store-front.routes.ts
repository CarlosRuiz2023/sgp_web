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

export const storeFrontRoutes: Routes = [
    {
        path: '',
        component:StoreFrontLayoutComponent,
        children:[
            {
                path:'obras',
                component:ObraPageComponent
            },
            {
                path: 'usuarios',
                component: UsuarioPageComponent
            },
            {
                path:'comites',
                component:ComitePageComponent
            },
            {
                path:'estimaciones',
                component: EstimacionPageComponent
            },
            {
                path:'contratos',
                component: ContratoPageComponent
            },
            {
                path:'solicitudes',
                component: SolicitudPageComponent
            },
            {
                path:'oficios-sapal',
                component: OficioSapalPageComponent
            },
            {
                path:'**',
                component:NotFoundPageComponent
            }
        ]
    },
    {
        path:'**',
        redirectTo:''
    }
]
export default storeFrontRoutes;