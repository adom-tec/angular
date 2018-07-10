import { environment } from './../../../environments/environment';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatInput } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { DocumentTypes } from '../../models/documentTypes';
import { SelectOption } from '../../models/selectOption';
import { UserService } from './../../services/user.service';
import { Coordinator } from './../../models/coordinator';
import { CoordinatorService } from './../../services/coordinator.service';
import { NotifierService } from 'angular-notifier';

@Component({
	selector: 'app-coordinators',
	templateUrl: './coordinators.component.html',
	styleUrls: ['./coordinators.component.css']
})
export class CoordinatorsComponent implements OnInit {
	public mainSpinner: boolean = false;
	public loading: boolean = false;
	public displayedColumns: string[] = [];
	public dataSource = new MatTableDataSource([]);
	public filter: string;
	public formActive: boolean = false;

	public coordinators: Coordinator[];
	public currentCoord: number;
	public documentTypes: DocumentTypes[];
	public genders: SelectOption[];
	public coord: Coordinator = {
		Document: '',
		DocumentTypeId: null,
		GenderId: null,
		BirthDate: '',
		Telephone1: null,
		Telephone2: null,
		Email: '',
		FirstName: '',
		SecondName: '',
		Surname: '',
		SecondSurname: '',
		State: ''
	}

	//Validators
	public validator = {
		documentType: new FormControl('', [Validators.required]),
		document: new FormControl('', [Validators.required]),
		email: new FormControl('', [Validators.required, Validators.email]),
		name: new FormControl('', [Validators.required]),
		lastname: new FormControl('', [Validators.required]),
		sex: new FormControl('', [Validators.required])
	};

	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(MatSort) sort: MatSort;

	constructor(
		private http: HttpService,
		private auth: AuthenticationService,
		private coordService: CoordinatorService,
		private userService: UserService,
		private notifier: NotifierService
	) { }

	ngOnInit() {
		this.mainSpinner = true;

		Observable.forkJoin(
			this.coordService.getCoordinators(),
			this.http.get(`${environment.apiUrl}/api/documenttypes`),
			this.http.get(`${environment.apiUrl}/api/genders`)
		).subscribe(res => {
			this.mainSpinner = false;
			this.mapCoordinatorToTableFormat(res[0]);
			this.documentTypes = res[1].json();
			this.genders = res[2].json();
		}, err => {
			this.mainSpinner = false;
			if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
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
		return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
			formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' :
				formcontrol.hasError('email') ? 'Ingrese un email con el formato correcto' : '';
	}

	/**
   * mapCoordinatorToTableFormat
   */
	public mapCoordinatorToTableFormat(data: Coordinator[]): void {
		this.coordinators = data.map(coord => {
			coord.BirthDate = moment(coord.BirthDate);
			return coord;
		});

		this.dataSource.data = data.map(coord => {
			return {
				CoordinatorId: coord.CoordinatorId,
				Document: coord.Document,
				Names: `${coord.user.FirstName} ${coord.user.SecondName || ''}`.trim().toLowerCase(),
				Lastnames: `${coord.user.Surname} ${coord.user.SecondSurname || ''}`.trim().toLowerCase(),
			};
		});

		this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
	}

	verifyUserExist(email: string): void {
		if (this.currentCoord) { return; }

		this.loading = true;
		this.coord.FirstName = '';
		this.coord.SecondName = '';
		this.coord.Surname = '';
		this.coord.SecondSurname = '';

		this.userService.getUsers(email)
			.subscribe(data => {
				Object.keys(this.coord).forEach(key => {
					if (data[key]) {
						this.coord[key] = data[key];
					}
				});
				this.loading = false;
			}, err => {
				this.loading = false;
			});
	}

	/**
	 * validateKey
	 */
	public validateKey(e: any, typeDocumentId: number) {
		var validKeyCode = [8, 37, 39, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 9];

		if (![3, 5].includes(+typeDocumentId)) {
			if (!validKeyCode.includes(e.keyCode)) {
				e.stopPropagation();
				e.preventDefault();

				return false;
			}
		}
	}

	/**
   * showForm
   */
	public showForm(id?: number): void {
		this.formActive = true;
		this.filter = '';
		this.applyFilter('');
		this.coord.GenderId = this.genders[0].Id;

		if (id) {
			let row = this.coordinators.find(coord => coord.CoordinatorId === id);
			this.currentCoord = id;

			Object.keys(this.coord).forEach(key => {
				this.coord[key] = row[key] ? parseInt(row[key]) ? parseInt(row[key]) : row[key] : null;


				Object.keys(this.coord).forEach(key => {
					if (row.user[key]) {
						this.coord[key] = row.user[key];
					}
				});
			});
		}
	}

	/**
	 * hideForm
	 */
	public hideForm(): void {
		Object.keys(this.coord).forEach(key => {
			this.coord[key] = null;
		});

		this.loading = false;
		this.formActive = false;
		this.currentCoord = null;

		Object.keys(this.validator).forEach(key => {
			this.validator[key].reset();
		});

		this.mainSpinner = true;

		this.coordService.getCoordinators()
			.subscribe(data => {
				this.mainSpinner = false;
				this.mapCoordinatorToTableFormat(data);
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
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

		return invalid;
	}

	/**
	 * create and update.
	 */
	public submitForm(coord: Coordinator): void {
		this.loading = true;

		this.coordService.createOrUpdate(coord, this.currentCoord)
			.subscribe(res => {
				this.notifier.notify('success', this.currentCoord ? 'Se aplicaron los cambios con exito' : 'Se creo el coordinador con exito');
				this.hideForm();
			}, err => {
				this.loading = false;
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
			});
	}

}
