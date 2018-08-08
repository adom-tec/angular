import { RoleService } from './../../../services/role.service';
import { UserService } from './../../../services/user.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { HttpService } from './../../../services/http-interceptor.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { Role } from './../../../models/role';
import { User } from '../../../models';
import { environment } from '../../../../environments/environment';
import { NotifierService } from 'angular-notifier';

@Component({
    selector: 'app-user-role',
    templateUrl: 'user-role.component.html',
    styleUrls: ['user-role.component.css']
})
export class UserRoleComponent implements OnInit {
    public mainSpinner: boolean = false;
    public loading: boolean = false;
    public formActive: boolean = false;
    public displayedColumns: string[] = [];
    public dataSource: MatTableDataSource<User> = new MatTableDataSource([])
    public filter: string;
    public permissions: any = {
        update: false
    };
    
    public currentUser: number;
    public roles: Role[] = [];

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        private http: HttpService,
        private auth: AuthenticationService,
        private userService: UserService,
        private roleService: RoleService,
        private notifier: NotifierService
    ) { }

    ngOnInit() {
        this.permissions.update = this.auth.hasActionResource('Update');
        this.loadData();
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

    loadData(): void {
        this.mainSpinner = true;

        Observable.forkJoin(
            this.userService.getUsers(),
            this.roleService.getRoles()
        ).subscribe(res => {
            this.dataSource.data = res[0].map(user => {
                user.State = user.State === '0' ? false : true;
                return user;
            });
            this.displayedColumns = res[0].length ? Object.keys(res[0][0]).filter(col => !['IsAdmin', 'SecondName', 'SecondSurname'].includes(col)) : [];
            this.roles = res[1].map(role => {
                role.State = role.State === '0' ? false : true;
                role.hasRole = false;
                return role;
            });
            this.mainSpinner = false;
        }, err => {
            if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
            this.mainSpinner = false;
        });
    }

    toogleState(role: Role): void {
        role.hasRole = !role.hasRole;
    }

    /**
     * showForm
     */
    public showForm(id: number): void {
        this.currentUser = id;
        this.mainSpinner = true;
        this.http.get(`${environment.apiUrl}/api/users/${id}/roles`)
            .map(res => res.json())
            .map(data => data.map(userRol => userRol.role))
            .subscribe(data => {
                this.roles.forEach(role => {
                    role.hasRole = data.find(userRole => userRole.RoleId == role.RoleId) ? true : false;

                    return role;
                });

                this.mainSpinner = false;
                this.formActive = true;
                this.filter = '';
                this.applyFilter('');

            }, err => {
                this.mainSpinner = false;
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
            });
    }

    /**
     * hideForm
     */
    public hideForm(): void {
        this.loading = false;
        this.formActive = false;
        this.currentUser = null;
        this.loadData();
    }

    /**
     * create and update.
     */
    public submitForm(): void {
        let roles = {
            roles: this.roles
                .map(role => {
                    if (role.hasRole) {
                        return role.RoleId;
                    }
                })
                .filter(id => id)
        };

        this.loading = true;
        this.http.post(`${environment.apiUrl}/api/users/${this.currentUser}/roles`, JSON.stringify(roles))
            .subscribe(res => {
                this.notifier.notify('success', 'Se aplicaron los cambios con éxito');
                this.hideForm();
            }, err => {
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
                this.loading = false;
            });
    }
}