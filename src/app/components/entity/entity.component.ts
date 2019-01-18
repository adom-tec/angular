import { EntityService } from './../../services/entity.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialog } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Entity } from '../../models';
import { PlansRatesDialogComponent } from './plans-rates/plans-rates.component';
import { NotifierService } from 'angular-notifier';

@Component({
	selector: 'app-entity',
	templateUrl: './entity.component.html',
	styleUrls: ['./entity.component.css']
})
export class EntityComponent implements OnInit {
	public mainSpinner: boolean = false;
	public loading: boolean = false;
	public displayedColumns: string[] = [];
	public dataSource = new MatTableDataSource([]);
	public filter: string;
	public formActive: boolean = false;
	public permissions: any = {
		create: false,
		update: false,
		planRate: false
	};

	public currentEntity: number;
	public entity: Entity = {
		Nit: '',
		BusinessName: '',
		Code: '',
		Name: ''
	};

	//Validators
	public validator = {
		nit: new FormControl('', [Validators.required]),
		businessName: new FormControl('', [Validators.required]),
		code: new FormControl('', [Validators.required]),
		name: new FormControl('', [Validators.required])
	};

	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(MatSort) sort: MatSort;

	constructor(
		private http: HttpService,
		private auth: AuthenticationService,
		private entitytService: EntityService,
		public dialog: MatDialog,
		private notifier: NotifierService
	) { }

	ngOnInit() {
		this.permissions.create = this.auth.hasActionResource('Create');
		this.permissions.update = this.auth.hasActionResource('Update');
		this.permissions.planRate = this.auth.hasActionResource('PlanRate');

		this.mainSpinner = true;
		this.entitytService.getEntities()
			.subscribe(data => {
				this.dataSource.data = data;
				this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
				this.mainSpinner = false;
			}, err => {
				this.mainSpinner = false;
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
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
		return formcontrol.hasError('required') ? 'El campo no puede estar vacío' :
			formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' : '';
	}

	openDialog(id: number, name: string): void {
		let dialogRef = this.dialog.open(PlansRatesDialogComponent, {
			width: '900px',
			height: '600px',
			panelClass: 'myapp-position-relative-dialog',
			data: {
				entity: id,
				name: name
			}
		});

		// dialogRef.afterClosed().subscribe(result => {
		// 	console.log('The dialog was closed');
		// });
	}

	/**
   * showForm
   */
	public showForm(id?: number): void {
		this.formActive = true;
		this.filter = '';
		this.applyFilter('');

		if (id) {
			let row = this.dataSource.data.find(entity => entity.EntityId === id);
			
			this.currentEntity = id;

			Object.keys(this.entity).forEach(key => {
				this.entity[key] = row[key] ? parseInt(row[key]) ? parseInt(row[key]) : row[key] : null;
			});
		}
	}

	/**
	 * hideForm
	 */
	public hideForm(): void {
		Object.keys(this.entity).forEach(key => {
			this.entity[key] = null;
		});

		this.loading = false;
		this.formActive = false;
		this.currentEntity = null;

		Object.keys(this.validator).forEach(key => {
			this.validator[key].reset();
		});

		this.mainSpinner = true;

		this.entitytService.getEntities()
			.subscribe(data => {
				this.dataSource.data = data;
				this.mainSpinner = false;
			}, err => {
				this.mainSpinner = false;
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

	/**
	 * formInvalid
	 */
	public formInvalid(): boolean {
		let invalid = false;

		Object.keys(this.validator).forEach(key => {
			invalid = this.validator[key].invalid || invalid;
		});

		return invalid || this.loading;
	}

	/**
	 * create and update.
	 */
	public submitForm(entity: Entity): void {
		this.loading = true;

		this.entitytService.createOrUpdate(entity, this.currentEntity)
			.subscribe(res => {
				this.notifier.notify('success',this.currentEntity ? 'Se aplicaron los cambios con éxito' : 'Se creo la entidad con éxito');
				this.hideForm();
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

}