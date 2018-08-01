import { RoleService } from './../../../services/role.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { HttpService } from './../../../services/http-interceptor.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { Role } from './../../../models/role';
import { NotifierService } from 'angular-notifier';

@Component({
    selector: 'app-roles',
    templateUrl: 'role.component.html',
    styleUrls: ['role.component.css']
})

export class RoleComponent implements OnInit {
    public mainSpinner: boolean = false;
    public loading: boolean = false;
    public formActive: boolean = false;
    public displayedColumns: string[] = [];
    public dataSource: MatTableDataSource<Role> = new MatTableDataSource([])
    public filter: string;
    public permissions: any = {
        create: false,
        update: false
    };
    
    public currentRole: number;
    public role: Role = {
        Name: '',
        State: ''
    };

    //Validators
    public name = new FormControl('', [Validators.required]);

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        private http: HttpService,
        private auth: AuthenticationService,
        private roleService: RoleService,
        private notifier: NotifierService
    ) { }

    ngOnInit() {
        this.permissions.create = this.auth.hasActionResource('Create');
        this.permissions.update = this.auth.hasActionResource('Update');
        this.getRoles();
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
        return formcontrol.hasError('required') ? 'El campo no puede estar vacio' : '';
    }

    /**
     * getRoles
     */
    public getRoles(): void {
        this.mainSpinner = true;

        this.roleService.getRoles()
            .subscribe(data => {
                this.dataSource.data = data.map(role => {
                    role.State = role.State === '0' ? false : true;
                    return role;
                });
                this.displayedColumns = data.length ? Object.keys(data[0]) : [];
                this.mainSpinner = false;
            }, err => {
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
                this.mainSpinner = false;
            });;
    }

    /**
     * showForm
     */
    public showForm(id?: number): void {
        this.formActive = true;
        this.filter = '';
        this.applyFilter('');
        this.role.State = '1';

        if (id) {
            let row = this.dataSource.data.find(row => row.RoleId === id);

            this.currentRole = id;

            Object.keys(this.role).forEach(key => {
                this.role[key] = row[key] ? row[key] : null;
            });
        }
    }

    /**
     * hideForm
     */
    public hideForm(): void {
        //clear form
        Object.keys(this.role).forEach(key => {
            this.role[key] = null;
        });

        this.name.reset();
        this.loading = false;
        this.formActive = false;
        this.currentRole = null;

        this.getRoles();
    }

    /**
     * formInvalid
     */
    public formInvalid(): boolean {
        return this.name.invalid || this.loading;
    }

    /**
     * create and update.
     */
    public submitForm(role: Role): void {
        this.loading = true;
        
        this.roleService.createOrUpdate(role, this.currentRole)
            .subscribe(res => {
                this.notifier.notify('success', this.currentRole ? 'Se aplicaron los cambios con exito' : 'Se creo el role con exito');
                this.hideForm();
            }, err => {
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
            });
    }
}