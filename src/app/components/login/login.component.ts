import { environment } from './../../../environments/environment';
import { HttpService } from './../../services/http-interceptor.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../services/index';
import { FormGroup, Validators, FormControl, FormGroupDirective } from '@angular/forms';
import { NotifierService } from 'angular-notifier';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    public loading: boolean = false;
    public recoveryPassword: boolean = false;
    public form = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required])
    });

    @ViewChild('formDirective') myNgForm: FormGroupDirective;

    constructor(
        private http: HttpService,
        private route: ActivatedRoute,
        private router: Router,
        private auth: AuthenticationService,
        private notifier: NotifierService
    ) {}

    ngOnInit() {
        this.auth.logout();
    }

    getErrorMessage(formcontrol): string {
        return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
            formcontrol.hasError('email') ? 'Ingrese un email con el formato correcto' : '';
    }

    clearForm(): void {
      Object.keys(this.form.controls).forEach(key => {
        this.form.controls[key].reset();
      });

      this.myNgForm.resetForm();
    }

    /**
     * toggleState
     */
    public toggleState(): void {
      this.recoveryPassword = !this.recoveryPassword;
      this.clearForm();
    }

    public submitForm(): void {
        this.loading = true;

        if (!this.recoveryPassword) {
          this.auth.login(this.form.value.email, this.form.value.password)
              .subscribe(data => {
                  window.localStorage.setItem('current_user', JSON.stringify(data));

                  this.http.get(`${environment.apiUrl}/api/users/me`)
                      .map(res => res.json())
                      .subscribe(data => {
                          window.localStorage.setItem('me', JSON.stringify(data));
                          this.router.navigate(['/notices']);
                      }, err => {
                          this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
                          this.loading = false;
                          this.auth.logout();
                      });
              }, err => {
                  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
                  this.loading = false;
              });
        } else {
          this.auth.recoveryPassword(this.form.value.email)
            .subscribe(() => {
              this.notifier.notify('success', 'Se envió un correo a la dirección que ingreso');
              this.loading = false;
              this.recoveryPassword = false;
            }, err => {
              this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
              this.loading = false;
            });
        }
    }
}
