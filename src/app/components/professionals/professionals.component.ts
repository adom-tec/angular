import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatInput } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SelectOption } from '../../models/selectOption';
import { UserService, ProfessionalService } from '../../services';
import { Professional } from './../../models/professional';
import { environment } from './../../../environments/environment';
import { DocumentTypes } from '../../models/documentTypes';
import { NotifierService } from 'angular-notifier';

@Component({
	selector: 'app-professionals',
	templateUrl: './professionals.component.html',
	styleUrls: ['./professionals.component.css']
})
export class ProfessionalComponent implements OnInit {
	public mainSpinner: boolean = false;
	public loading: boolean = false;
	public displayedColumns: string[] = [];
	public dataSource = new MatTableDataSource([]);
	public filter: string;
	public formActive: boolean = false;
	public permissions: any = {
		create: false,
		update: false,
		active: false
	};

	public professionals: Professional[];
	public currentProfessional: number;
	public documentTypes: DocumentTypes[];
	public genders: SelectOption[];
	public accountTypes: SelectOption[];
	public specialties: SelectOption[];
	public contractTypes: SelectOption[];
	public professional: Professional = {
		DocumentTypeId: null,
		Document: '',
		FirstName: '',
		SecondName: '',
		Surname: '',
		SecondSurname: '',
		BirthDate: null,
		DateAdmission: null,
		ContractTypeId: null,
		GenderId: null,
		SpecialtyId: null,
		Address: '',
		Neighborhood: '',
		Telephone1: null,
		Telephone2: null,
		Email: '',
		Availability: '',
		Coverage: '',
		FamilyName: '',
		FamilyRelationship: '',
		FamilyPhone: '',
		CodeBank: '',
		AccountTypeId: null,
		AccountNumber: null,
		State: true
	}

	//Validators
	public validator = {
		documentType: new FormControl('', [Validators.required]),
		document: new FormControl('', [Validators.required]),
		name: new FormControl('', [Validators.required]),
		lastname: new FormControl('', [Validators.required]),
		sex: new FormControl('', [Validators.required]),
		specialty: new FormControl('', [Validators.required]),
		addess: new FormControl('', [Validators.required]),
		phone: new FormControl('', [Validators.required]),
		email: new FormControl('', [Validators.required, Validators.email]),
		availability: new FormControl('', [Validators.required]),
		codeBank: new FormControl('', [Validators.required]),
		accountTypeId: new FormControl('', [Validators.required]),
		accountNumber: new FormControl('', [Validators.required]),
		contractType: new FormControl('', [Validators.required]),
	};

	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(MatSort) sort: MatSort;

	constructor(
		private http: HttpService,
		private auth: AuthenticationService,
		private professionalService: ProfessionalService,
		private userService: UserService,
		private notifier: NotifierService
	) { }

	ngOnInit() {
		this.permissions.create = this.auth.hasActionResource('Create');
		this.permissions.update = this.auth.hasActionResource('Update');
		this.permissions.active = this.auth.hasActionResource('Active');
		this.mainSpinner = true;

		Observable.forkJoin(
			this.professionalService.getProfessionals(),
			this.http.get(`${environment.apiUrl}/api/documenttypes`),
			this.http.get(`${environment.apiUrl}/api/genders`),
			this.http.get(`${environment.apiUrl}/api/accountTypes`),
			this.http.get(`${environment.apiUrl}/api/specialties`),
			this.http.get(`${environment.apiUrl}/api/contracttypes`),
		).subscribe(res => {
			this.mapProfessionalToTableFormat(res[0]);
			this.documentTypes = res[1].json();
			this.genders = res[2].json();
			this.accountTypes = res[3].json();
			this.specialties = res[4].json();
			this.contractTypes = res[5].json();
			this.mainSpinner = false;
		}, err => {
			this.mainSpinner = false;
			if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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
   * mapProfessionalToTableFormat
   */
	public mapProfessionalToTableFormat(data: Professional[]): void {
		this.professionals = data.map(pro => {
			pro.BirthDate = moment(pro.BirthDate);
			pro.DateAdmission = moment(pro.DateAdmission);
			return pro;
		});

		this.dataSource.data = data.map(pro => {
			return {
				state: pro.user.State === '0' ? false : true,
				professionalId: pro.ProfessionalId,
				Document: pro.Document,
				Names: `${pro.user.FirstName} ${pro.user.SecondName || ''}`.trim(),
				Lastnames: `${pro.user.Surname} ${pro.user.SecondSurname || ''}`.trim(),
			};
		});

		this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
	}

	verifyUserExist(email: string): void {
		if (this.currentProfessional) { return; }

		this.loading = true;
		this.professional.FirstName = '';
		this.professional.SecondName = '';
		this.professional.Surname = '';
		this.professional.SecondSurname = '';

		this.userService.getUsers(email)
			.subscribe(data => {
				Object.keys(this.professional).forEach(key => {
					if (data[key]) {
						this.professional[key] = data[key];
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
		// this.professional.GenderId = this.genders[0].Id;

		if (id) {
			let row = this.professionals.find(professional => professional.ProfessionalId === id);
			this.currentProfessional = id;

			Object.keys(this.professional).forEach(key => {
				this.professional[key] = row[key] ? parseInt(row[key]) ? parseInt(row[key]) : row[key] : null;

				Object.keys(this.professional).forEach(key => {
					if (row.user[key]) {
						this.professional[key] = row.user[key];
					}
				});
			});
		}
	}

	/**
	 * hideForm
	 */
	public hideForm(): void {
		Object.keys(this.professional).forEach(key => {
			this.professional[key] = null;
		});

		this.loading = false;
		this.formActive = false;
		this.currentProfessional = null;

		Object.keys(this.validator).forEach(key => {
			this.validator[key].reset();
		});

		this.mainSpinner = true;

		this.professionalService.getProfessionals()
			.subscribe(data => {
				this.mainSpinner = false;
				this.mapProfessionalToTableFormat(data);
			}, err => {
				this.mainSpinner = false;
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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
	public submitForm(professional: Professional): void {
		this.loading = true;

		this.professionalService.createOrUpdate(professional, this.currentProfessional)
			.subscribe(() => {
				this.notifier.notify('success', this.currentProfessional ? 'Se aplicaron los cambios con éxito' : 'Se creo al profesional con éxito');
				this.hideForm();
			}, err => {
				this.loading = false;
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

	/**
	 * updateStateProfessional
	 */
	public updateStateProfessional(id: number) {
		let user = this.professionals.find(professional => professional.ProfessionalId === id).user;

		user.State = user.State === '0' ? true : false;

		this.mainSpinner = true;

		this.userService.createOrUpdate(user, user.UserId)
			.subscribe(() => {
				this.hideForm();
				this.notifier.notify('success', 'Se actualizo el estado del profesional con éxito');
			}, err => {
				this.mainSpinner = false;
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

}
