import { UserService } from './../../../services/user.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { HttpService } from './../../../services/http-interceptor.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { User } from './../../../models/user';

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

    //Validators
    public password = new FormControl('', [Validators.required]);
    public passwordConfirm = new FormControl('', [Validators.required]);

    constructor(
        private http: HttpService,
        private auth: AuthenticationService,
        private userService: UserService
    ) { }

    ngOnInit() {
        let currentUser = JSON.parse(window.localStorage.getItem('me'));
        Object.keys(this.user).forEach(key => {
            this.user[key] = currentUser[key] ? currentUser[key] : null;
        });
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

        this.userService.createOrUpdate(user, this.user.UserId)
            .subscribe(res => {
                this.loading = false;
                alert('se actualizaron los datos con exito')
            }, err => {
                this.loading = false;
                console.log(err)
            });
    }
}