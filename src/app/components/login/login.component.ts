import { environment } from './../../../environments/environment';
import { HttpService } from './../../services/http-interceptor.service';
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Response } from '@angular/http';
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
    public form = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required])
    });

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

    public submitForm(): void {
        this.loading = true;

        this.auth.login(this.form.value.email, this.form.value.password)
            .subscribe(data => {
                window.localStorage.setItem('current_user', JSON.stringify(data));
                
                this.http.get(`${environment.apiUrl}/api/users/me`)
                    .map(res => res.json())
                    .subscribe(data => {
                        window.localStorage.setItem('me', JSON.stringify(data));
                        this.router.navigate(['/notices']);
                    }, err => {
                        console.log(err);
                    });
            }, err => {
                this.notifier.notify('error', 'Ha ocurrido un error, por favor intente nuevamente');
                this.loading = false;
            });
    }
}
