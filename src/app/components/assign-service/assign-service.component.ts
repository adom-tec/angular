import { AssignServiceService } from './../../services/assignService.service';
import { Professional } from './../../models/professional';
import { AssignService } from './../../models/assignService';
import { ProfessionalService } from './../../services/professional.service';
import { environment } from './../../../environments/environment';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatInput, MatDialog } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SelectOption } from '../../models/selectOption';
import { PatientService, AssignServiceSupplyService, AssignServiceDetailService } from '../../services';
import { Patient } from '../../models/patient';
import { AssignServiceDialogComponent } from './assign-service-dialog/assign-service-dialog.component';
import { PatientDialogComponent } from './patient-dialog/patient-dialog.component';
import { ObservationsDialogComponent } from './observations-dialog/observations-dialog.component';
import { AssignServiceSupply, AssignServiceDetail, User } from '../../models';
import { ServiceSupplyDialogComponent } from './service-supply-dialog/service-supply-dialog.component';
import { NotifierService } from 'angular-notifier';
import { EditAssignedServiceDialogComponent } from './edit-assigned-service-dialog/edit-assigned-service-dialog.component';
import { QuialityTestDialogComponent } from './quiality-test-dialog/quiality-test-dialog.component';
import { CancelVisitsDialogComponent } from './cancel-visits-dialog/cancel-visits-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignServiceParams } from '../../models/assign-service-params';
import { Subject, ReplaySubject } from 'rxjs';

@Component({
	selector: 'app-assign-service',
	templateUrl: './assign-service.component.html',
	styleUrls: ['./assign-service.component.css']
})
export class AssignServiceComponent implements OnInit, OnDestroy, AfterViewInit {
	public loading: boolean = false;
	public mainSpinner: boolean = false;
	public servicesSpinner: boolean = false;
	public suppliesSpinner: boolean = false;
	public visitsSpinner: boolean = false;
	public displayedColumns: string[] = [];
	public dataSource = new MatTableDataSource([]);
	public assignServiceDisplayedColumns: string[] = [];
	public assignServiceSource = new MatTableDataSource([]);
	public suppliesDisplayedColumns: string[] = [];
	public suppliesSource = new MatTableDataSource([]);
	public filterMain: string;
	public filterAssignServices: string;
	public filterSupplies: string;
	public formActive: boolean = false;

	public patients: Patient[];
	public professionals: Professional[];
	public patientAssignServices: AssignService[];
	public assignServiceSupplies: AssignServiceSupply[];
	public currentPatient: Patient;
	public currentAssignService: AssignService;
	public assignSeriviceDetail: AssignServiceDetail[] = [];
	public assignSeriviceDetailCopy: AssignServiceDetail[] = [];
	public states: SelectOption[];
	public showQualityTest: boolean = false;
	public professionalRates: any = [];
	public paymentTypes: SelectOption[] = [
		{
			Id: 1,
			Name: "Efectivo"
		},
		{
			Id: 2,
			Name: "PIN"
		},
		{
			Id: 3,
			Name: "OTRO"
		}
	];
	public routeParams: AssignServiceParams;

	@ViewChild('patientTable') patientTable: MatSort;
	@ViewChild('asgServiceTable') asgServiceTable: MatSort;
	@ViewChild('suppliesTable') suppliesTable: MatSort;
	@ViewChild('patientPager') patientPager: MatPaginator;
	@ViewChild('asgServicePager') asgServicePager: MatPaginator;
	@ViewChild('suppliesPager') suppliesPager: MatPaginator;

	private _onDestroy = new Subject<void>();

	constructor(
		private http: HttpService,
		private auth: AuthenticationService,
		private patientService: PatientService,
		private professionalService: ProfessionalService,
		private assignService: AssignServiceService,
		public dialog: MatDialog,
		private assignServiceSupplyService: AssignServiceSupplyService,
		private visitsDetail: AssignServiceDetailService,
		private notifier: NotifierService,
		private route: ActivatedRoute,
		private router: Router,
	) { }

	ngOnInit() {
		this.getData();

		this.route
			.queryParams
			.subscribe((params: AssignServiceParams) => {
				this.routeParams = params; 
			});
	}

	ngAfterViewInit() {
		this.dataSource.sort = this.patientTable;
		this.dataSource.paginator = this.patientPager;
		this.assignServiceSource.sort = this.asgServiceTable;
		this.assignServiceSource.paginator = this.asgServicePager;
		this.suppliesSource.sort = this.suppliesTable;
		this.suppliesSource.paginator = this.suppliesPager;
	}

	ngOnDestroy() {
		this._onDestroy.next();
		this._onDestroy.complete();
	}

	public applyFilter(filterValue: string, type: string): void {
		filterValue = filterValue.trim(); // Remove whitespace
		filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches

		switch (type) {
			case 'main':
				this.dataSource.filter = filterValue;
				break;

			case 'service':
				this.assignServiceSource.filter = filterValue;
				break;

			case 'supply':
				this.suppliesSource.filter = filterValue;
				break;
		
			default:
				this.dataSource.filter = filterValue;
				break;
		}
	}

	getErrorMessage(formcontrol): string {
		return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
			formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' :
				formcontrol.hasError('email') ? 'Ingrese un email con el formato correcto' : '';
	}

	getData(): void {
		this.mainSpinner =  true;
		Observable.forkJoin(
			this.patientService.getPatients(),
			this.professionalService.getProfessionals(),
			this.http.get(`${environment.apiUrl}/api/states`).map(res => res.json()),
			this.http.get(`${environment.apiUrl}/api/professionalrates`).map(res => res.json())
		).subscribe(res => {
			this.mapPatientToTableFormat(res[0]);
			
			//crea la opcion 'por asignar' en professionals
			let withoutProfessional = new Professional();
			withoutProfessional.ProfessionalId = -1;
			withoutProfessional.user = new User();
			withoutProfessional.user.FirstName = 'Por';
			withoutProfessional.user.Surname = 'Asignar';
			this.professionals = [withoutProfessional].concat(res[1]);

			this.states = res[2];
			this.professionalRates = res[3];
			this.mainSpinner = false;

			if (this.routeParams.patientId) {
				this.showForm(+this.routeParams.patientId);
			}
		}, err => {
			if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
		});
	}

	/**
	 * mapPatientToTableFormat
	 */
	public mapPatientToTableFormat(data: Patient[]): void {
		this.patients = data.map(patient => {
			patient.BirthDate = moment(patient.BirthDate);
			return patient;
		});

		this.dataSource.data = this.patientService.mapPatientToTableFormat(data);
		this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
	}

	/**
	 * showForm
	 */
	public showForm(id: number): void {
		let patient = this.patients.find(patient => patient.PatientId === id);

		this.formActive = true;
		this.filterMain = '';
		this.applyFilter('', 'main');
		this.currentPatient = patient;
		this.getPatientServices(id);
	}

	hideForm() {
		if (/\&|\?/g.test(this.router.url)) {
			this.router.navigate(['/assignservice']);
			return;
		}
		this.getData();
		this.formActive = false;
		this.patientAssignServices = [];
		this.assignServiceSupplies = [];
		this.assignSeriviceDetail = [];
		this.assignSeriviceDetailCopy = [];
		this.currentPatient = null;
		this.currentAssignService = null;
		this.filterMain = null;
		this.filterAssignServices = null;
		this.filterSupplies = null;
		this.applyFilter('', 'main');
		this.applyFilter('', 'service');
		this.applyFilter('', 'supply');
	}

	getPatientServices(id: number): void {
		this.servicesSpinner = true;
		this.assignService.getPatientAssignServices(id)
			.subscribe(data => {
				this.servicesSpinner = false;
				this.patientAssignServices = data;
				this.assignServiceSource.data = this.assignService.mapToTableFormat(data);
				this.assignServiceDisplayedColumns = this.assignServiceSource.data.length ? Object.keys(this.assignServiceSource.data[0]) : [];

				if (this.routeParams.assignServiceId) {
					this.showDetailAssignService({ assignServiceId: +this.routeParams.assignServiceId });
				}
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
				this.servicesSpinner = false;
			});
	}

	openDialogPatient(): void {
		let dialogRef = this.dialog.open(PatientDialogComponent, {
			width: '1000px',
			height: '700px',
			panelClass: 'myapp-position-relative-dialog',
			data: {
				patientId: this.currentPatient.PatientId
			}
		});

		dialogRef.afterClosed().subscribe(patient => {
			if (patient) {
				this.currentPatient = patient;
			}
		});
	}

	openDialogServices(): void {
		let dialogRef = this.dialog.open(AssignServiceDialogComponent, {
			width: '900px',
			height: '600px',
			panelClass: 'myapp-position-relative-dialog',
			data: {
				patientId: this.currentPatient.PatientId,
				professionals: this.professionals
			}
		});

		dialogRef.afterClosed().subscribe(() => {
			this.getPatientServices(this.currentPatient.PatientId);
		});
	}

	openDialogObservations(id: number, e: Event): void {
		e.stopPropagation();

		let dialogRef = this.dialog.open(ObservationsDialogComponent, {
			width: '900px',
			height: '600px',
			panelClass: 'myapp-position-relative-dialog',
			data: {
				assignServiceId: id
			}
		});

		dialogRef.afterClosed().subscribe(() => { });
	}

	openDialogSupplies(): void {
		let dialogRef = this.dialog.open(ServiceSupplyDialogComponent, {
			width: '700px',
			height: '600px',
			panelClass: 'myapp-position-relative-dialog',
			data: {
				assignServiceId: this.currentAssignService.AssignServiceId
			}
		});

		dialogRef.afterClosed().subscribe(() => {
			this.getServiceSupplies(this.currentAssignService.AssignServiceId);
		});
	}

	openDialogEditAssinedService(): void {
		let dialogRef = this.dialog.open(EditAssignedServiceDialogComponent, {
			width: '700px',
			height: '600px',
			panelClass: 'myapp-position-relative-dialog',
			data: {
				assignedService: this.currentAssignService,
				patientId: this.currentPatient.PatientId
			}
		});

		dialogRef.afterClosed().subscribe(data => {
			if (data) {
				this.patientAssignServices = this.patientAssignServices.map(service => service.AssignServiceId === data.AssignServiceId ? data : service);
				this.currentAssignService = data;
			}
		});
	}

	openDialogQualitytest(): void {
		let dialogRef = this.dialog.open(QuialityTestDialogComponent, {
			width: '700px',
			height: '600px',
			panelClass: 'myapp-position-relative-dialog',
			data: {
				assignServiceId: this.currentAssignService.AssignServiceId,
				serviceTypeId: this.currentAssignService.service.ServiceTypeId,
			}
		});

		dialogRef.afterClosed().subscribe(() => { });
	}

	openDialogCancelVisits(assignSeriviceDetail: AssignServiceDetail[]): void {
		let dialogRef = this.dialog.open(CancelVisitsDialogComponent, {
			width: '700px',
			height: '600px',
			panelClass: 'myapp-position-relative-dialog',
			data: {
				visits: assignSeriviceDetail
					.filter(visit => visit.isSelected)
					.map(visit => Object.assign({}, visit))
			}
		});

		dialogRef.afterClosed().subscribe((visits: AssignServiceDetail[]) => {
			if (visits) {
				visits = visits.map(visit => {
					visit.StateId = 3;		
					return visit;
				});
				this.saveVisits(visits);
			}
		});
	}

	showDetailAssignService(row: any) {
		this.currentAssignService = this.patientAssignServices.find(service => service.AssignServiceId === row.assignServiceId);

		if (this.routeParams.assignServiceId) {
			let serviceDate = moment(this.currentAssignService.InitialDate).format('DD/MM/YYYY');
			this.filterAssignServices = serviceDate;
			this.applyFilter(serviceDate, 'service');
		}

		this.getServiceSupplies(row.assignServiceId);

		this.visitsSpinner = true;

		this.visitsDetail.getAssignedServiceDetail(row.assignServiceId)
			.subscribe(data => {
				this.visitsSpinner = false;
				this.assignSeriviceDetail = data.map(visit => {
					visit.DateVisit = moment(visit.DateVisit);
					visit.Verified = visit.Verified === '0' ? false : true;
					visit.isSelected = false;
					visit.StateId = (+visit.StateId);
					visit.ProfessionalId = (+visit.ProfessionalId);
					visit.professional_rate_id = (+visit.professional_rate_id);
					visit.PaymentType = (+visit.PaymentType);
					visit.selectFilter = null;
					visit.selectFilteredData = new ReplaySubject<Professional[]>(1);
					visit.selectFilteredData.next(this.professionals.slice());
					return visit;
				});

				this.assignSeriviceDetailCopy = this.assignSeriviceDetail.map(visit => visit = Object.assign({}, visit));

				this.showQualityTest = this.allVisitsCompleted();
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
				this.visitsSpinner = false;
			});
	}

	toogleVisitRowState(row: AssignServiceDetail, key: string): void {
		if (key !== 'Verified') {
			row[key] = !row[key];
		} else if (key === 'Verified') {
			if (row.Verified) {
				if (moment(row.DateVisit).format() === 'Invalid date') {
					this.notifier.notify('error', 'Debe seleccionar la fecha de visita para poder marcar como verificado');
					
					setTimeout(() => {
						row[key] = !row[key];
					}, 500);
				} else {
					this.saveVisitRow(row);
				}
			} else {
				this.notifier.notify('error', 'La visita ya se fue verificada, no puede cambiar su estado');
				setTimeout(() => {
					row[key] = !row[key];
				}, 500);
			}
		}
	}

	visitHasRowSelected(): boolean {
		return this.assignSeriviceDetail ? this.assignSeriviceDetail.every(visit => !visit.isSelected) : false;
	}

	allVisitsCompleted(): boolean {
		let visits = this.assignSeriviceDetail
			.map(visit => visit = Object.assign({}, visit));

		return visits.length ? visits.every(visit => visit.StateId !== 1) && visits.some(visit => !visit.QualityCallUser) : false;
	}

	filterStates(assignServiceDetailId: number): SelectOption[] {
		let row = this.assignSeriviceDetailCopy.find(visit => visit.AssignServiceDetailId === assignServiceDetailId);
		
		return this.states.filter(state => row.StateId === 3 ? state : state.Id !== 3);
	}

	saveVisits(assignSeriviceDetail: AssignServiceDetail[]): void {
		let invalid = false;

		assignSeriviceDetail = assignSeriviceDetail
			.filter(visit => visit.isSelected)
			.map(visit => {
				visit = Object.assign({}, visit);
				visit.Verified = visit.Verified ? '1' : '0';
				return visit;
			});

		for (let visit of assignSeriviceDetail) {
			if (moment(visit.DateVisit).format() === 'Invalid date' && (+visit.StateId) === 2) {
				this.notifier.notify('error', `En la visita #${visit.Consecutive} es necesario ingresar la fecha de visita`);
				
				invalid = true;
			}
		}

		if (invalid) { return; }

		this.visitsSpinner = true;

		this.visitsDetail.update(assignSeriviceDetail, this.currentAssignService.AssignServiceId)
			.subscribe(res => {
				this.visitsSpinner = false;
				this.notifier.notify('success', 'Se aplicarion los cambios con exito');
				this.getPatientServices(this.currentPatient.PatientId);
				this.showDetailAssignService({ assignServiceId: this.currentAssignService.AssignServiceId });
				
			}, err => {
				this.visitsSpinner = false;
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
			});
	}

	saveVisitRow(assignSeriviceDetail: AssignServiceDetail): void {
		this.visitsSpinner = true;

		assignSeriviceDetail.Verified = assignSeriviceDetail.Verified ? '1' : '0';

		this.visitsDetail.updateDetail(assignSeriviceDetail, this.currentAssignService.AssignServiceId, assignSeriviceDetail.AssignServiceDetailId)
			.subscribe(res => {
				this.visitsSpinner = false;
				this.notifier.notify('success', 'Se aplicarion los cambios con exito');
			}, err => {
				this.visitsSpinner = false;
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
			});
	}

	rowIsActive(row: any): boolean {
		return !this.currentAssignService ? false : this.currentAssignService.AssignServiceId === row.assignServiceId;
	}

	getServiceSupplies(id: number): void {
		this.suppliesSpinner = true;
		this.assignServiceSupplyService.getServiceSupplies(id)
			.subscribe(data => {
				this.suppliesSpinner = false;
				this.assignServiceSupplies = data;
				this.suppliesSource.data = this.assignServiceSupplyService.mapToTableFormat(data);
				this.suppliesDisplayedColumns = this.suppliesSource.data.length ? Object.keys(this.suppliesSource.data[0]) : [];
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
				this.suppliesSpinner = false;
			});
	}

	deleteSupply(id: number): void {
		this.suppliesSpinner = true;
		this.assignServiceSupplyService.delete(this.currentAssignService.AssignServiceId, id)
			.subscribe(res => {
				this.notifier.notify('success', 'Se elimino el insumo con exito');
				this.assignServiceSupplies = this.assignServiceSupplies.filter(supply => supply.AssignServiceSupplyId !== id);
				this.suppliesSource.data = this.assignServiceSupplyService.mapToTableFormat(this.assignServiceSupplies);
				this.suppliesSpinner = false;
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
				this.suppliesSpinner = false;
			});
	}

	/**
	 * funciones para columnas adicionales para editar valores ingresados desde mis servicios
	 */

	/**
	* validateKey
	*/
	public validateKey(e: any) {
		let validKeyCode = [8, 37, 39, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 9];

		if (!validKeyCode.includes(e.keyCode)) {
			e.stopPropagation();
			e.preventDefault();

			return false;
		}
	}

	public clearValues(visit: AssignServiceDetail): void {
		visit.ReceivedAmount = null;
		visit.Pin = null;
	}

	getPaymentTypeName(id: number): string {
		let paymentType = this.paymentTypes.find(type => type.Id === id);

		return paymentType ? paymentType.Name : 'No Registrado';
	}

	getRateName(professionalRateId: number): string {
		return this.professionalRates.find(rate => rate.id === professionalRateId).Name;
	}

	getRateValue(professionalRateId: number): number {
		let key = null;

		switch (+professionalRateId) {
			case 1:
				key = 'Value';
				break;
			case 2:
				key = 'special_value';
				break;
			case 3:
				key = 'particular_value';
				break;
			case 4:
				key = 'holiday_value';
				break;
			default:
				key = 'Value';
				break;
		}

		return (+this.currentAssignService.service[key]);
	}

	//select professinals filtro
	private selectFilterData(selectFilterSubject: ReplaySubject<Professional[]>, value: string): void {
		if (!this.professionals) {
			return;
		}
		// get the search keyword
		if (!value) {
			selectFilterSubject.next(this.professionals.slice());

			return;
		} else {
			value = value.toLowerCase();
		}
		// filter the professionals
		selectFilterSubject.next(
			this.professionals.filter(pro => ['FirstName', 'SecondName', 'Surname', 'SecondSurname'].some(key => pro.user[key] ? pro.user[key].toLowerCase().indexOf(value) > -1 : false))
		);
	}

	private resetSelectList(selectFilterSubject: ReplaySubject<Professional[]>): void {
		selectFilterSubject.next(this.professionals.slice());
	}
}
