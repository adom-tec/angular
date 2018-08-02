import { Patient } from './../../models/patient';
import { AssignService } from './../../models/assignService';
import { environment } from './../../../environments/environment';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatInput } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SelectOption } from '../../models/selectOption';
import { ProfessionalAssignedServicesService, PatientService, AssignServiceDetailService } from '../../services';
import { NotifierService } from 'angular-notifier';
import { ProfessionalService, AssignServiceDetail } from '../../models';

@Component({
  selector: 'app-professional-assigned-services',
  templateUrl: './professional-assigned-services.component.html',
  styleUrls: ['./professional-assigned-services.component.css']
})
export class ProfessionalAssignedServicesComponent implements OnInit {
  public mainSpinner: boolean = false;
  public servicesInProcessColumns: string[] = [];
  public servicesInProcessSource = new MatTableDataSource([]);
  public historyColumns: string[] = [];
  public historySource = new MatTableDataSource([]);
  public filter: string;
  public filterHistory: string;
  public formActive: boolean = false;

  public showProfessionalRateValue: boolean = false;
  public scheduledServices: AssignService[] = [];
  public completedServices: AssignService[] = [];
  public currentAssignService: AssignService;
  public currentPatient: Patient;
  public assignSeriviceDetail: AssignServiceDetail[] = [];
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

  @ViewChild('inProcessPager') inProcessPager: MatPaginator;
  @ViewChild('inProcessTable') inProcessTable: MatSort;
  @ViewChild('historyPager') historyPager: MatPaginator;
  @ViewChild('historyTable') historyTable: MatSort;

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private proAssignedServices: ProfessionalAssignedServicesService,
    private notifier: NotifierService,
    private patientService: PatientService,
    private visitsDetail: AssignServiceDetailService
  ) { }

  ngOnInit() {
    this.getMyServices();
  }

  ngAfterViewInit() {
    this.servicesInProcessSource.paginator = this.inProcessPager;
    this.servicesInProcessSource.sort = this.inProcessTable;
    this.historySource.paginator = this.historyPager;
    this.historySource.sort = this.historyTable;
  }

  public applyFilter(filterValue: string, type: string): void {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches

    switch (type) {
      case 'main':
        this.servicesInProcessSource.filter = filterValue;
        break;

      case 'history':
        this.historySource.filter = filterValue;

      default:
        this.servicesInProcessSource.filter = filterValue;
        break;
    }
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' :
        formcontrol.hasError('email') ? 'Ingrese un email con el formato correcto' : '';
  }

  /**
   * getMyServices
   */
  public getMyServices() {
    this.mainSpinner = true;

    Observable.forkJoin(
      this.proAssignedServices.getProfessionalAssignedServices(1),
      this.proAssignedServices.getProfessionalAssignedServices(2),
      this.http.get(`${environment.apiUrl}/api/professionalrates`).map(res => res.json())
    ).subscribe(res => {
      this.mainSpinner = false;

      this.scheduledServices = res[0];
      this.servicesInProcessSource.data = this.proAssignedServices.mapToTableInProcessFormat(res[0]);
      this.servicesInProcessColumns = this.servicesInProcessSource.data.length ? Object.keys(this.servicesInProcessSource.data[0]) : [];

      this.completedServices = res[1];
      this.historySource.data = this.proAssignedServices.mapToTableHistoryFormat(res[1]);
      this.historyColumns = this.historySource.data.length ? Object.keys(this.historySource.data[0]) : [];

      this.professionalRates = res[2];
    }, err => {
      this.mainSpinner = false;
      if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
    });
  }

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

    if (diff < 0) {
      this.notifier.notify('error', 'La fecha de visita no puede ser una fecha del futuro, por favor vuelva a ingresarla');
      setTimeout(()=> {
        visit.DateVisit = null;
      }, 200);

    } else if (diffInitAndVisitDate > 0) {
      this.notifier.notify('error', 'La fecha de visita no puede ser menor a la fecha de inicio del servicio');
      setTimeout(()=> {
        visit.DateVisit = null;
      }, 200);

    } else if (diff > 2) {
      this.notifier.notify('error', 'La fecha de visita no puede ser menor a 2 días, por favor vuelva a ingresarla');
      setTimeout(()=> {
        visit.DateVisit = null;
      }, 200);
    }
  }

	/**
   * showForm
   */
  public showForm(id: number, type: string): void {
    if (type === 'process') {
      this.filter = '';
      this.applyFilter('', 'main');
      this.currentAssignService = this.scheduledServices.find(service => service.AssignServiceId === id);
    } else {
      this.filterHistory = '';
      this.applyFilter('', 'history');
      this.currentAssignService = this.completedServices.find(service => service.AssignServiceId === id);
    }

    this.mainSpinner = true;
    this.showProfessionalRateValue = (+this.currentAssignService.StateId) !== 1;

    Observable.forkJoin(
      this.patientService.getPatientById(this.currentAssignService.PatientId),
      this.visitsDetail.getMyAssignedServiceDetail(this.currentAssignService.AssignServiceId)
    ).subscribe(res => {
      this.mainSpinner = false;
      this.formActive = true;

      this.currentPatient = res[0];
      this.assignSeriviceDetail = res[1].map(visit => {
        visit.DateVisit = moment(visit.DateVisit);
        visit.StateId = (+visit.StateId);
        return visit;
      });
    }, err => {
      this.mainSpinner = false;
      if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
    });
  }

	/**
	 * hideForm
	 */
  public hideForm(): void {
    this.formActive = false;
    this.currentAssignService = null;
    this.currentPatient = null;
    this.assignSeriviceDetail = null;
    this.getMyServices();
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

	/**
	 * update visit.
	 */
  public saveRow(row: AssignServiceDetail): void {
    if (moment(row.DateVisit).format() === 'Invalid date') {
      this.notifier.notify('error', 'Por favor ingrese la fecha de visita');
      return;
    }

    if (!row.PaymentType) {
      this.notifier.notify('error', 'Por favor seleccione el metodo de pago');
      return;
    }

    if (row.PaymentType === 1 && typeof row.ReceivedAmount !== 'number') {
      this.notifier.notify('error', 'Por favor ingrese el monto recibido');
      return;
    }

    if (row.PaymentType === 1 && row.ReceivedAmount < 0) {
      this.notifier.notify('error', 'Por favor verifique el monto ingresado, el monto no puede ser menor a 0');
      return;
    }

    if (row.PaymentType === 2 && !row.Pin) {
      this.notifier.notify('error', 'Por favor ingrese el numero de pin');
      return;
    }

    row.StateId = 2;

    this.mainSpinner = true;

    this.visitsDetail.updateDetail(row, row.AssignServiceId, row.AssignServiceDetailId)
      .subscribe(() => {
        this.notifier.notify('success','Se aplicaron los cambios con éxito');

        this.visitsDetail.getMyAssignedServiceDetail(this.currentAssignService.AssignServiceId)
          .subscribe(data => {
            this.mainSpinner = false;
            this.assignSeriviceDetail = data.map(visit => {
              visit.DateVisit = moment(visit.DateVisit);
              visit.StateId = (+visit.StateId);
              return visit;
            });
          }, err => {
            this.mainSpinner = false;
            if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
          });
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

}
