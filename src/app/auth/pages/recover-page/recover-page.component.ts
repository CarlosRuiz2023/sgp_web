import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@auth/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recover-page',
  imports: [ReactiveFormsModule],
  templateUrl: './recover-page.component.html',
})
export class RecoverPageComponent {
  fb = inject(FormBuilder);

  authService = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  recover() {
    if (this.loginForm.invalid) {
      Swal.fire({
        title: 'Proceso fallido',
        text: 'Correo invalido',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3b82f6' // azul Tailwind (opcional)
      }).then(() => {
        // recargar la página después de cerrar el alert
        //window.location.href = '/entregas?page=1';
      });
      return;
    }
    const { email = '' } = this.loginForm.value;
    this.authService.recover(email!).subscribe((isAuthenticated) => {
      console.log({ isAuthenticated });
    });
  }
}
