import { Routes } from "@angular/router";
import { StoreFrontLayoutComponent } from "./layouts/store-front-layout/store-front-layout.component";
import { ObraPageComponent } from "./pages/obra-page/obra-page.component";
import { GenderPageComponent } from "./pages/gender-page/gender-page.component";
import { ProductPageComponent } from "./pages/product-page/product-page.component";
import { NotFoundPageComponent } from "./pages/not-found-page/not-found-page.component";
import { UsuarioPageComponent } from "./pages/usuario-page/usuario-page.component";

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
                path:'gender/:gender',
                component:GenderPageComponent
            },
            {
                path:'product/:idSlug',
                component: ProductPageComponent
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