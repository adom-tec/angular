import { UserService } from './../../../services/user.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { User } from './../../../models/user';
import { NotifierService } from 'angular-notifier';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { HttpService } from '../../../services';
import { AuthenticationService } from '../../../services/authentication.service';

@Component({
    selector: 'app-change-password',
    templateUrl: 'changePassword.component.html',
    styleUrls: ['changePassword.component.css']
})

export class ChangePasswordComponent implements OnInit {
    public loading: boolean = false;
    public user: User = {
        UserId: null,
        Email: '',
        Password: '',
        PasswordConfirm: '',
        FirstName: '',
        SecondName: '',
        Surname: '',
        SecondSurname: '',
        State: '1'
    };

    //route params
    public uuid: string;
    public recoveryPassword: boolean = false;

    //Validators
    public password = new FormControl('', [Validators.required]);
    public passwordConfirm = new FormControl('', [Validators.required]);

    constructor(
        private auth: AuthenticationService,
        private userService: UserService,
        private notifier: NotifierService,
        private route: ActivatedRoute,
        private http: HttpService,
        private router: Router
    ) {
      this.recoveryPassword = this.router.url !== '/changepassword';
    }

    ngOnInit() {
      if (!this.recoveryPassword) {
        this.http.get(`${environment.apiUrl}/api/users/me`)
          .map(res => res.json())
          .subscribe(data => {
            Object.keys(this.user).forEach(key => {
              this.user[key] = data[key] ? data[key] : null;
            });
          }, err => {
              this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
          });
      } else {
        this.route.params.subscribe( params => {
          this.uuid = params['uuid']
          this.auth.verifyLinkValidity(this.uuid)
            .subscribe(() => { },
              err => {
                this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : 'El link al que intenta acceder es incorrecto, por favor solicite otro nuevamente');

                setTimeout(() => {
                  this.router.navigate(['/login']);
                }, 2000);
            });
        });
      }
    }

    getErrorMessage(formcontrol): string {
        return formcontrol.hasError('required') ? 'El campo no puede estar vacio' : '';
    }

    /**
     * formInvalid
     */
    public formInvalid(): boolean {
        return !(this.password.valid
                && this.passwordConfirm.valid
                && this.user.Password === this.user.PasswordConfirm)
    }

    /**
     * create and update users.
     */
    public submitForm(user: User): void {
        this.loading = true;

        if (!this.recoveryPassword) {
          this.userService.createOrUpdate(user, this.user.UserId)
            .subscribe(res => {
                this.loading = false;
                this.notifier.notify('success', 'se actualizaron los datos con éxito');
            }, err => {
                this.loading = false;
                if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
            });
        } else {
          this.auth.updatePassword(this.uuid, this.user.Password)
            .subscribe(res => {
              this.loading = false;
              this.notifier.notify('success', 'se actualizaron los datos con éxito');
              this.router.navigate(['/login']);
            }, err => {
                this.loading = false;
                this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
            });
        }
    }
}
