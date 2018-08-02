import { UserService } from './../../../services/user.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { HttpService } from './../../../services/http-interceptor.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { User } from './../../../models/user';
import { NotifierService } from 'angular-notifier';

@Component({
    selector: 'app-users',
    templateUrl: 'user.component.html',
    styleUrls: ['user.component.css']
})

export class UserComponent implements OnInit {
    public mainSpinner: boolean = false;
    public loading: boolean = false;
    public formUser: boolean = false;
    public displayedColumns: string[] = [];
    public dataSource = new MatTableDataSource([])
    public permissions: any = {
        create: false,
        update: false
    };

    public currentUser: number;
    public filter: string;
    public user: User = {
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
    public email = new FormControl('', [Validators.required, Validators.email]);
    public firstname = new FormControl('', [Validators.required]);
    public surname = new FormControl('', [Validators.required]);
    public password = new FormControl('', [Validators.required]);
    public passwordConfirm = new FormControl('', [Validators.required]);

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        private http: HttpService,
        private auth: AuthenticationService,
        private userService: UserService,
        private notifier: NotifierService
    ){}

    ngOnInit() {
        this.permissions.create = this.auth.hasActionResource('Create');
        this.permissions.update = this.auth.hasActionResource('Update');
        this.getUsers();
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    public applyFilter(filterValue: string): void {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }

    getErrorMessage(formcontrol): string {
        return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
            formcontrol.hasError('email') ? 'Ingrese un email con el formato correcto' : '';
    }

    getUsers(): void {
        this.mainSpinner = true;
        this.userService.getUsers()
            .subscribe(data => {
                this.dataSource.data = data.map(user => {
                    user.State = user.State === '0' ? false : true;
                    return user;
                });
                this.displayedColumns = data.length ? Object.keys(data[0]).filter(col => !['IsAdmin', 'SecondName', 'SecondSurname'].includes(col)) : [];
                this.mainSpinner = false;
            }, err => {
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
                this.mainSpinner = false;
            });
    }

    /**
     * showFormUser
     */
    public showFormUser(id?: number): void {
        this.formUser = true;
        this.filter = '';
        this.applyFilter('');
        this.user.State = '1'; 

        if (id) {
            let row = this.dataSource.data.find(row => row.UserId === id);

            this.currentUser = id;

            Object.keys(this.user).forEach(key => {
                this.user[key] = row[key] ? row[key] : null;
            });
        }
    }

    /**
     * hideFormUser
     */
    public hideFormUser(): void {
        //clear form
        Object.keys(this.user).forEach(key => {
            this.user[key] = null;
        });

        this.formUser = false;
        this.loading = false;
        this.currentUser = null;

        //reset validators
        this.email.reset();
        this.firstname.reset();
        this.surname.reset();
        this.password.reset();
        this.passwordConfirm.reset();

        this.getUsers();
    }

    /**
     * formInvalid
     */
    public formInvalid(): boolean {
        if (this.currentUser) {
            return !(
                this.email.valid
                && this.firstname.valid
                && this.surname.valid
            ) || this.loading;
        } else {
            return !(
                this.email.valid
                && this.firstname.valid 
                && this.surname.valid
                && this.password.valid
                && this.passwordConfirm.valid
                && this.user.Password === this.user.PasswordConfirm
            ) || this.loading;
        }
    }

    /**
     * create and update users.
     */
    public submitForm(user: User): void {
        this.loading = true;

        this.userService.createOrUpdate(user, this.currentUser)  
            .subscribe(res => {
                this.notifier.notify('success', this.currentUser ? 'El usuario se modifico con éxito' : 'El usuario se creo con éxito');
                this.hideFormUser();
            }, err => {
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
                this.loading = false;
            });
    }
}