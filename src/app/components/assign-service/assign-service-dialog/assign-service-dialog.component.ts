import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NotifierService } from 'angular-notifier';
import { ReplaySubject } from 'rxjs';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import { AssignService } from './../../../models/assignService';
import { SelectOption } from './../../../models/selectOption';
import { ServiceFrecuency } from './../../../models/serviceFrecuency';
import { CoPaymentFrecuency } from './../../../models/coPaymentFrecuency';
import { PlanEntity } from './../../../models/planEntity';
import { PlanRatesService } from './../../../services/plan-rates.service';
import { PlanRate } from './../../../models/planRate';
import { EntityService } from './../../../services/entity.service';
import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { HttpService } from '../../../services/http-interceptor.service';
import { Entity } from './../../../models/entity';
import { environment } from './../../../../environments/environment';
import { PlansEntityService, AssignServiceService } from '../../../services';

@Component({
  selector: 'app-assign-service-dialog',
  templateUrl: './assign-service-dialog.component.html',
  styleUrls: ['./assign-service-dialog.component.css']
})
export class AssignServiceDialogComponent implements OnInit {
  loading: boolean = false;
  loadingBar: boolean = false;

  currentPatient: number;
  entities: Entity[];
  planRates: SelectOption[] = [];
  planEntities: PlanEntity[] = [];
  professionals: SelectOption[];
  coPaymentFrecuencies: CoPaymentFrecuency[];
  serviceFrecuencies: ServiceFrecuency[];
  patientService: AssignService = {
    ContractNumber: '',
    EntityId: null,
    PlanEntityId: null,
    Cie10: '',
    DescriptionCie10: '',
    AuthorizationNumber: '',
    Validity: null,
    ApplicantName: '',
    ServiceId: null,
    Quantity: 1,
    ServiceFrecuencyId: null,
    InitialDate: null,
    FinalDate: null,
    ProfessionalId: null,
    CoPaymentAmount: 1,
    CoPaymentFrecuencyId: null,
    Consultation: 1,
    External: 1,
    InitDateAuthorizationNumber: null,
    FinalDateAuthorizationNumber: null,
  };

  //Validators
  validator = {
    contractNumber: new FormControl('', [Validators.required]),
    entity: new FormControl('', [Validators.required]),
    planEntityId: new FormControl('', [Validators.required]),
    cie10: new FormControl('', [Validators.required]),
    authorizationNumber: new FormControl('', [Validators.required, Validators.maxLength(15), Validators.pattern('^[a-zA-Z0-9 ]+$')]),
    validity: new FormControl('', [Validators.required]),
    applicantName: new FormControl('', [Validators.required]),
    serviceId: new FormControl('', [Validators.required]),
    quantity: new FormControl('', [Validators.required, Validators.min(1)]),
    serviceFrecuency: new FormControl('', [Validators.required]),
    initialDate: new FormControl('', [Validators.required]),
    finalDate: new FormControl('', [Validators.required]),
    professionalId: new FormControl('', [Validators.required]),
    coPaymentAmount: new FormControl('', [Validators.required, Validators.min(0)]),
    coPaymentFrecuency: new FormControl('', [Validators.required]),
    consultation: new FormControl('', [Validators.required, Validators.min(1)]),
    external: new FormControl('', [Validators.required, Validators.min(1)]),
  };

  //select filters
  entityFilter: string = null;
  entityFilteredData: ReplaySubject<Entity[]> = new ReplaySubject<Entity[]>(1);
  serviceFilter: string = null;
  serviceFilteredData: ReplaySubject<SelectOption[]> = new ReplaySubject<SelectOption[]>(1);
  professionalFilter: string = null;
  professionalFilteredData: ReplaySubject<SelectOption[]> = new ReplaySubject<SelectOption[]>(1);

  constructor(
    public dialogRef: MatDialogRef<AssignServiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpService,
    private entityService: EntityService,
    private planRateService: PlanRatesService,
    private plansEntityService: PlansEntityService,
    private assignService: AssignServiceService,
    private notifier: NotifierService
  ) {
    this.currentPatient = this.data.patientId;
    this.patientService.PatientId = this.currentPatient;
    this.professionals = this.data.professionals
      .filter(pro => pro.State);
    this.professionalFilteredData.next(this.professionals.slice());

    if (this.data.lastestService) {
      this.patientService.ContractNumber = this.data.lastestService.ContractNumber;
      this.patientService.EntityId = +this.data.lastestService.EntityId;
      this.getPlansEntity(this.patientService.EntityId);
      this.patientService.PlanEntityId = +this.data.lastestService.PlanEntityId;
      this.getPlanRates(this.patientService.PlanEntityId);
      this.patientService.Cie10 = this.data.lastestService.Cie10;
      this.patientService.DescriptionCie10 = this.data.lastestService.DescriptionCie10;
    }
  }

  ngOnInit() {
    this.loading = true;

    Observable.forkJoin(
      this.entityService.getEntities(),
      this.http.get(`${environment.apiUrl}/api/copaymentfrecuencies`).map(res => res.json()),
      this.http.get(`${environment.apiUrl}/api/servicefrecuencies`).map(res => res.json())
    ).subscribe(res => {
      this.entities = res[0];
      this.entityFilteredData.next(this.entities.slice());
      this.coPaymentFrecuencies = res[1];
      this.serviceFrecuencies = res[2];
      this.loading = false;
    }, err => {
      this.loading = false;
      if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' :
        formcontrol.hasError('maxLength') ? 'No puede ingresar más de 15 caracteres' :
          formcontrol.hasError('pattern') ? 'Ingrese solo valores alfanuméricos' : '';
  }

  getPlansEntity(id: number): void {
    this.planEntities = [];
    this.patientService.PlanEntityId = null;
    this.planRates = [];
    this.patientService.ServiceId = null;
    this.loadingBar = true;

    this.plansEntityService.getPlansByEntity(id)
      .subscribe(data => {
        this.planEntities = data.filter(plan => +plan.State ? true : false);
        this.loadingBar = false;
      }, err => {
        this.loadingBar = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      })
  }

  getPlanRates(id: number): void {
    this.planRates = [];
    this.patientService.ServiceId = null;
    this.loadingBar = true;

    this.planRateService.getPlanRates(id)
      .subscribe((data: PlanRate[]) => {
        this.planRates = data.map(plan => {
          return {
            Id: plan.ServiceId,
            Name: plan.service.Name
          };
        });
        this.serviceFilteredData.next(this.planRates.slice());
        this.loadingBar = false;
      }, err => {
        this.loadingBar = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      })
  }

  calculateFinalDate(quantity: number, serviceFrecuencyId: number, initialDate: any): void {
    this.loadingBar = true;

    if (initialDate.format() !== 'Invalid date') {
      this.assignService.calculateFinalDateAssignService(quantity, serviceFrecuencyId, initialDate.format('YYYY-DD-MM'))
        .subscribe(data => {
          this.loadingBar = false;
          this.patientService.FinalDate = moment(data.date);
        }, err => {
          this.loadingBar = false;
          if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        });
    }
  }

  /**
	 * formInvalid
	 */
  formInvalid(): boolean {
    let invalid = false;

    Object.keys(this.validator).forEach(key => {
      invalid = this.validator[key].invalid || invalid;
    });

    return invalid;
  }

  submitForm(patientService: AssignService): void {
    patientService = Object.assign({}, patientService);
    patientService.Validity = moment(patientService.Validity).format('YYYY-MM-DD');
    patientService.InitialDate = moment(patientService.InitialDate).format('YYYY-MM-DD');
    patientService.FinalDate = moment(patientService.FinalDate).format('YYYY-MM-DD');

    this.loading = true;

    this.assignService.createOrUpdate(this.currentPatient, patientService)
      .subscribe(data => {
        this.notifier.notify('success', 'Se asigno el servico al paciente con éxito');
        this.onNoClick();
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  //select filters
  selectFilterData(selectFilterSubject: ReplaySubject<any[]>, dataSource: any[], value: string): void {
    if (!dataSource) {
      return;
    }
    // get the search keyword
    if (!value) {
      selectFilterSubject.next(dataSource.slice());

      return;
    } else {
      value = value.toLowerCase().replace(/\s+/g, ' ');;
    }
    // filter
    selectFilterSubject.next(
      dataSource.filter(val => val.Name ? val.Name.toLowerCase().replace(/\s+/g, ' ').indexOf(value) > -1 : false)
    );
  }

  resetSelectList(selectFilterSubject: ReplaySubject<any[]>, dataSource: any[]): void {
    selectFilterSubject.next(dataSource.slice());
    this.changeTopPosition();
  }

  private changeTopPosition(): void {
    setTimeout(() => {
      let nodes = document.getElementsByClassName('cdk-overlay-pane');
      let cardTop = document.querySelector('.mat-card').getBoundingClientRect().top;

      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].clientHeight) {
          let panelTop = nodes[i].getBoundingClientRect().top;
          if (panelTop < cardTop) {
            (nodes[i] as HTMLElement).style.top = '200px';
          }
        }
      }
    }, 100);
  }
}
