import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialog } from '@angular/material';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subject, ReplaySubject } from 'rxjs';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';

import { AssignServiceService } from './../../services/assignService.service';
import { AssignService } from './../../models/assignService';
import { ProfessionalService } from './../../services/professional.service';
import { environment } from './../../../environments/environment';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SelectOption } from '../../models/selectOption';
import { PatientService, AssignServiceSupplyService, AssignServiceDetailService } from '../../services';
import { Patient } from '../../models/patient';
import { AssignServiceDialogComponent } from './assign-service-dialog/assign-service-dialog.component';
import { PatientDialogComponent } from './patient-dialog/patient-dialog.component';
import { ObservationsDialogComponent } from './observations-dialog/observations-dialog.component';
import { AssignServiceSupply, AssignServiceDetail } from '../../models';
import { ServiceSupplyDialogComponent } from './service-supply-dialog/service-supply-dialog.component';
import { NotifierService } from 'angular-notifier';
import { EditAssignedServiceDialogComponent } from './edit-assigned-service-dialog/edit-assigned-service-dialog.component';
import { QuialityTestDialogComponent } from './quiality-test-dialog/quiality-test-dialog.component';
import { CancelVisitsDialogComponent } from './cancel-visits-dialog/cancel-visits-dialog.component';
import { AssignServiceParams } from '../../models/assign-service-params';

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
  public notVisitsSelected: boolean = true;
  public showTableDetails: boolean = false;
  public permissions: any = {
    create: false,
    update: false,
    patientUpdate: false,
    invalidateVisit: false
  };

  public patients: Patient[];
  public professionals: SelectOption[];
  public patientAssignServices: AssignService[];
  public assignServiceSupplies: AssignServiceSupply[];
  public currentPatient: Patient;
  public currentAssignService: AssignService;
  public assignServiceDetail: AssignServiceDetail[] = [];
  public assignServiceDetailCopy: AssignServiceDetail[] = [];
  public states: SelectOption[];
  public showQualityTest: boolean = false;
  public professionalRates: any = [];
  public paymentTypes: SelectOption[] = [
    {
      Id: 1,
      Name: "EFECTIVO"
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
    this.permissions.create = this.auth.hasActionResource('Create');
    this.permissions.update = this.auth.hasActionResource('Update');
    this.permissions.patientUpdate = this.auth.hasActionResource('Update', '/patient');
    this.permissions.invalidateVisit = this.auth.hasActionResource('InvalidateVisit');

    this.route
      .queryParams
      .subscribe((params: AssignServiceParams) => {
        this.routeParams = params;
        this.getData();
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
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' :
        formcontrol.hasError('maxLength') ? 'No puede ingresar más de 15 caracteres' :
          formcontrol.hasError('pattern') ? 'Ingrese solo valores alfanuméricos' : '';
  }

  getData(): void {
    this.mainSpinner = true;
    Observable.forkJoin(
      !this.routeParams.patientId ? this.patientService.getPatients() :
        this.http.get(`${environment.apiUrl}/api/patients/${+this.routeParams.patientId}`).map(res => res.json()),
      this.professionalService.getProfessionals(),
      this.http.get(`${environment.apiUrl}/api/states`).map(res => res.json()),
      this.http.get(`${environment.apiUrl}/api/professionalrates`).map(res => res.json())
    ).subscribe(res => {
      //crea la opcion 'por asignar' en professionals
      let withoutProfessional = new SelectOption();
      withoutProfessional.Id = -1;
      withoutProfessional.Name = 'POR ASIGNAR';
      withoutProfessional.State = true;

      if (!this.routeParams.patientId) {
        this.mapPatientToTableFormat(res[0]);
      }

      this.professionals = res[1]
        .map(pro => {
          return {
            Id: pro.ProfessionalId,
            Name: `${pro.user.FirstName} ${pro.user.SecondName || ''} ${pro.user.Surname} ${pro.user.SecondSurname || ''}`,
            State: +pro.user.State ? true : false
          }
        });
      this.professionals = [withoutProfessional].concat(this.professionals);
      this.states = res[2];
      this.professionalRates = res[3];
      this.mainSpinner = false;

      if (this.routeParams.patientId) {
        let patient = <Patient>res[0];
        patient.BirthDate = moment(patient.BirthDate);
        this.patients = [patient];
        this.showForm(+this.routeParams.patientId);
      }
    }, err => {
      if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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
    } else {
      this.getData();
    }

    this.formActive = false;
    this.patientAssignServices = [];
    this.assignServiceSupplies = [];
    this.assignServiceDetail = [];
    this.assignServiceDetailCopy = [];
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
        this.assignServiceSource.data = data.length ? this.assignService.mapToTableFormat(data) : [];
        this.assignServiceDisplayedColumns = this.assignServiceSource.data.length ? Object.keys(this.assignServiceSource.data[0]) : [];

        if (this.routeParams.assignServiceId) {
          this.showDetailAssignService({ assignServiceId: +this.routeParams.assignServiceId });
        }
      }, err => {
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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
        patient.BirthDate = moment(patient.BirthDate)
        this.currentPatient = patient;
      }
    });
  }

  openDialogServices(): void {
    let lastestService = null;

    if (this.patientAssignServices.length > 1) {
      lastestService = this.patientAssignServices
        .sort((a, b) => {
          let first = moment(a.RecordDate)
          let second = moment(b.RecordDate)
          let diff = first.diff(second);

          return diff < 0 ? 1 : diff > 0 ? -1 : 0;
        })[0];
    } else if (this.patientAssignServices.length === 1) {
      lastestService = this.patientAssignServices[0];
    }

    let dialogRef = this.dialog.open(AssignServiceDialogComponent, {
      width: '900px',
      height: '600px',
      panelClass: 'myapp-position-relative-dialog',
      data: {
        patientId: this.currentPatient.PatientId,
        professionals: this.professionals,
        lastestService: lastestService
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

    // dialogRef.afterClosed().subscribe(() => { });
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

    // dialogRef.afterClosed().subscribe(() => { });
  }

  openDialogCancelVisits(assignServiceDetail: AssignServiceDetail[]): void {
    let dialogRef = this.dialog.open(CancelVisitsDialogComponent, {
      width: '700px',
      height: '600px',
      panelClass: 'myapp-position-relative-dialog',
      data: {
        visits: assignServiceDetail
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
        this.assignServiceDetail = data.map(visit => {
          visit.DateVisit = moment(visit.DateVisit);
          visit.Verified = visit.Verified === '0' ? false : true;
          visit.isSelected = false;
          visit.StateId = (+visit.StateId);
          visit.ProfessionalId = (+visit.ProfessionalId);
          visit.professional_rate_id = (+visit.professional_rate_id);
          visit.PaymentType = (+visit.PaymentType);
          visit.selectFilter = null;
          visit.selectFilteredData = new ReplaySubject<SelectOption[]>(1);
          visit.selectFilteredData.next(this.professionals.slice());
          visit.authorizationFC = new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ]+$')]);
          return visit;
        });

        this.assignServiceDetailCopy = this.assignServiceDetail.map(visit => visit = Object.assign({}, visit));
        this.showTableDetails = this.assignServiceDetailCopy.length ? true : false;
        this.showQualityTest = this.allVisitsCompleted();
      }, err => {
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.visitsSpinner = false;
      });
  }

  toogleVisitRowState(row: AssignServiceDetail, key: string): void {
    if (key !== 'Verified') {
      row[key] = !row[key];
      this.notVisitsSelected = this.visitsAreNotSelected();
    } else if (key === 'Verified') {
      if (row.Verified) {
        if (moment(row.DateVisit).format() === 'Invalid date') {
          this.notifier.notify('error', 'Debe seleccionar la fecha de visita para poder marcar como verificado');

          setTimeout(() => {
            row[key] = !row[key];
          }, 200);
        } else {
          this.saveVisitRow({ ...row });
        }
      } else {
        if (this.permissions.invalidateVisit) {
          this.saveVisitRow({ ...row });
          return;
        }

        this.notifier.notify('error', 'La visita ya fue verificada, no puede cambiar su estado');
        setTimeout(() => {
          row[key] = !row[key];
        }, 200);
      }
    }
  }

  visitsAreNotSelected(): boolean {
    return this.assignServiceDetail ? this.assignServiceDetail.every(visit => !visit.isSelected) : false;
  }

  allVisitsCompleted(): boolean {
    let visits = this.assignServiceDetailCopy;

    return visits.length ? visits.every(visit => visit.StateId !== 1) && visits.some(visit => !visit.QualityCallUser) : false;
  }

  filterStates(assignServiceDetailId: number): SelectOption[] {
    let row = this.assignServiceDetailCopy.find(visit => visit.AssignServiceDetailId === assignServiceDetailId);

    return this.states.filter(state => row.StateId === 3 ? state : state.Id !== 3);
  }

  saveVisits(assignServiceDetail: AssignServiceDetail[]): void {
    let invalid = false;

    assignServiceDetail = assignServiceDetail
      .filter(visit => visit.isSelected)
      .map(visit => {
        visit = Object.assign({}, visit);
        visit.Verified = visit.Verified ? '1' : '0';
        return visit;
      });

    for (let visit of assignServiceDetail) {
      if (moment(visit.DateVisit).format() === 'Invalid date' && (+visit.StateId) === 2) {
        this.notifier.notify('error', `En la visita #${visit.Consecutive} es necesario ingresar la fecha de visita`);

        invalid = true;
      }

      if (visit.PaymentType === 3 && visit.ReceivedAmount < 0) {
        this.notifier.notify('error', `En la visita #${visit.Consecutive} por favor verifique el monto ingresado, el monto no puede ser menor a 0`);
        invalid = true;
      }

      if (visit.PaymentType === 2 && !visit.Pin) {
        this.notifier.notify('error', `En la visita #${visit.Consecutive} por favor ingrese el número de pin`);
        invalid = true;
      }

      if (visit.OtherAmount && visit.OtherAmount < 0) {
        this.notifier.notify('error', `En la visita #${visit.Consecutive} por favor verifique el monto de Otro Valor, el monto no puede ser menor a 0`);
        invalid = true;
      }

      if (visit.authorizationFC.invalid) {
        this.notifier.notify('error', `En la visita #${visit.Consecutive} por favor verifique el número de autorización`);
        invalid = true;
      }
    }

    if (invalid) { return; }

    this.visitsSpinner = true;

    this.visitsDetail.update(assignServiceDetail, this.currentAssignService.AssignServiceId)
      .subscribe(res => {
        this.visitsSpinner = false;
        this.notifier.notify('success', 'Se aplicaron los cambios con éxito');
        this.getPatientServices(this.currentPatient.PatientId);
        this.showDetailAssignService({ assignServiceId: this.currentAssignService.AssignServiceId });

      }, err => {
        this.visitsSpinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  saveVisitRow(assignServiceDetail: AssignServiceDetail): void {
    this.visitsSpinner = true;

    assignServiceDetail.Verified = assignServiceDetail.Verified ? '1' : '0';

    this.visitsDetail.updateDetail(assignServiceDetail, this.currentAssignService.AssignServiceId, assignServiceDetail.AssignServiceDetailId)
      .subscribe(res => {
        this.visitsSpinner = false;
        this.notifier.notify('success', 'Se aplicaron los cambios con éxito');
      }, err => {
        this.visitsSpinner = false;
        assignServiceDetail.Verified = this.assignServiceDetailCopy
          .find(visit => visit.AssignServiceDetailId === assignServiceDetail.AssignServiceDetailId).Verified;

        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.suppliesSpinner = false;
      });
  }

  deleteSupply(id: number): void {
    this.suppliesSpinner = true;
    this.assignServiceSupplyService.delete(this.currentAssignService.AssignServiceId, id)
      .subscribe(res => {
        this.notifier.notify('success', 'Se elimino el insumo con éxito');
        this.assignServiceSupplies = this.assignServiceSupplies.filter(supply => supply.AssignServiceSupplyId !== id);
        this.suppliesSource.data = this.assignServiceSupplyService.mapToTableFormat(this.assignServiceSupplies);
        this.suppliesSpinner = false;
      }, err => {
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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

  /**
 * validateVisitDate
 */
  validateVisitDate(visit: AssignServiceDetail): void {
    let visitDate = moment(visit.DateVisit);
    let today = moment(moment().format('YYYY-MM-DD'));
    let diff = today.diff(visitDate, 'days');
    let serviceInitialDate = moment(this.currentAssignService.InitialDate);
    let diffInitAndVisitDate = serviceInitialDate.diff(visitDate);

    // if (diff < 0) {
    //   this.notifier.notify('error', 'La fecha de visita no puede ser una fecha del futuro, por favor vuelva a ingresarla');
    //   setTimeout(()=> {
    //     visit.DateVisit = null;
    //   }, 200);

    // } else

    if (diffInitAndVisitDate > 0) {
      this.notifier.notify('error', 'La fecha de visita no puede ser menor a la fecha de inicio del servicio');
      setTimeout(() => {
        visit.DateVisit = null;
      }, 200);
    }

    // else if (diff > 2) {
    //   this.notifier.notify('error', 'La fecha de visita no puede ser menor a 2 días, por favor vuelva a ingresarla');
    //   setTimeout(()=> {
    //     visit.DateVisit = null;
    //   }, 200);
    // }
  }

  public clearValues(visit: AssignServiceDetail): void {
    visit.ReceivedAmount = null;
    visit.Pin = null;

    if (visit.PaymentType === 1) {
      visit.ReceivedAmount = +this.currentAssignService.CoPaymentAmount;
    }
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
  public selectFilterData(selectFilterSubject: ReplaySubject<SelectOption[]>, value: string): void {
    if (!this.professionals) {
      return;
    }
    // get the search keyword
    if (!value) {
      selectFilterSubject.next(this.professionals.slice());

      return;
    } else {
      value = value.toLowerCase().replace(/\s+/g, ' ');
    }
    // filter the professionals
    selectFilterSubject.next(
      this.professionals.filter(pro => pro.Name.toLowerCase().replace(/\s+/g, ' ').indexOf(value) > -1)
    );
  }

  public resetSelectList(selectFilterSubject: ReplaySubject<SelectOption[]>): void {
    selectFilterSubject.next(this.professionals.slice());
  }
}
