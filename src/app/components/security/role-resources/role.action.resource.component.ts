import { environment } from './../../../../environments/environment';
import { Module } from './../../../models/module';
import { RoleService } from './../../../services/role.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatSelect } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { HttpService } from './../../../services/http-interceptor.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { Role } from './../../../models/role';
import { NotifierService } from 'angular-notifier';
import { ReplaySubject, Subject } from 'rxjs';

@Component({
    selector: 'app-roles-resource',
    templateUrl: 'role.action.resource.component.html',
    styleUrls: ['role.action.resource.component.css']
})

export class RoleActionResourceComponent implements OnInit {
    //nuevo
    public displayedColumns: string[] = [];
    public dataSource: MatTableDataSource<any> = new MatTableDataSource([])
    public formActive: boolean = false;
    public loading: boolean = false;
    public filter: string;
    public permissions: any = {
        update: false
    };
    
    public currentModule: number;
    public roles: Role[] = [];
    public modules: Module[] = [];
    public actionResourcesByRole = [];
    
    //select filters
    @ViewChild('selectRoles') selectRoles: MatSelect;
    public currentRole: number = null;
    public roleFilter: string = null;
    public filteredRoles: ReplaySubject<Role[]> = new ReplaySubject<Role[]>(1);
    private _onDestroy = new Subject<void>();

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        private http: HttpService,
        private auth: AuthenticationService,
        private roleService: RoleService,
        private notifier: NotifierService
    ) { }

    ngOnInit() {
        this.permissions.update = this.auth.hasActionResource('Update');
        this.loading = true;

        Observable.forkJoin(
            this.roleService.getRoles(),
            this.http.get(`${environment.apiUrl}/api/modules`).map(res => res.json())
        ).subscribe(res => {
            this.loading = false;
            this.roles = res[0];
            this.filteredRoles.next(this.roles.slice());
            this.modules = res[1];
        }, err => {
            this.loading = false;
            if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        });
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    public applyFilter(filterValue: string): void {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }

    /**
     * getRoleActionsResources
     */
    public getRoleActionsResources(id: number) {
        this.dataSource.data = [];
        this.currentModule = null;
        this.loading = true;

        this.http.get(`${environment.apiUrl}/api/roles/${id}/actionsresources`)
            .map(res => res.json())
                .subscribe(data => {
                    this.loading = false;
                    this.actionResourcesByRole = data;
                }, err => {
                    this.loading = false;
                    if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
                });
    }

    /**
     * resetForm
     */
    public resetForm() {
        this.loading = false;
        this.currentRole = null;
        this.dataSource.data = [];
        this.currentModule = null;
        this.filter = '';
        this.applyFilter('');
    }

    public getModuleActionsResources(id: number) {
        this.loading = true;
        this.dataSource.data = [];

        if (this.currentModule) {

            this.http.get(`${environment.apiUrl}/api/modules/${id}/actionsresources`)
                .map(res => res.json())
                .subscribe(data => {
                    this.loading = false;
                    this.dataSource.data = data.map(actioResource => {
                        return {
                            actionResourceId: {
                                id: actioResource.actionResourceId,
                                state: this.actionResourcesByRole.find(x => x.actionResourceId === actioResource.actionResourceId) ? true : false
                            },
                            resource: actioResource.resource.name,
                            action: actioResource.action.name
                        }
                    });
                    this.displayedColumns = data.length ? Object.keys(data[0]) : [];
                    this.filter = '';
                    this.applyFilter('');
                }, err => {
                    this.loading = false;
                    if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
                });
        }
    }

    /**
     * toogleState
     */
    public toogleState(row) {
        row.actionResourceId.state = !row.actionResourceId.state;
    }

    /**
     * create and update.
     */
    public submitForm(): void {
        let actionsResources = {
            moduleId: this.currentModule,
            actionsResources: this.dataSource.data
                .map(row => {
                    if (row.actionResourceId.state) {
                        return row.actionResourceId.id;
                    }
                })
                .filter(id => id)
        };
        
        this.loading = true;

        this.http.post(`${environment.apiUrl}/api/roles/${this.currentRole}/actionsresources`, JSON.stringify(actionsResources))
            .subscribe(res => {
                this.notifier.notify('success', 'Se aplicaron los cambios correctamente');
                this.resetForm();
            }, err => {
                this.loading = false;
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
            });
    }


    private filterRoles(value: string): void {
        if (!this.roles) {
            return;
        }
        // get the search keyword
        if (!value) {
            this.filteredRoles.next(this.roles.slice());
            return;
        } else {
            value = value.toLowerCase();
        }
        // filter the roles
        this.filteredRoles.next(
            this.roles.filter(role => role.Name.toLowerCase().indexOf(value) > -1)
        );
    }

    private resetSelectList(): void {
        this.filteredRoles.next(this.roles.slice())
    }
}