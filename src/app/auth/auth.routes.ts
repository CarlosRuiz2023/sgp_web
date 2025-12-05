import { Routes } from "@angular/router";
import { AuthLayoutComponent } from "./layout/auth-layout/auth-layout.component";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { RecoverPageComponent } from "./pages/recover-page/recover-page.component";

export const authRoutes:Routes = [{
    path:'',
    component:AuthLayoutComponent,
    children:[
        {
            path:'login',
            component:LoginPageComponent
        },
        {
            path:'recover',
            component:RecoverPageComponent
        },
        {
            path:'**',
            redirectTo:'login'
        }
    ]
}];
export default authRoutes;