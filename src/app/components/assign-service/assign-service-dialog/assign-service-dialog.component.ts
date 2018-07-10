import { AssignService } from './../../../models/assignService';
import { SelectOption } from './../../../models/selectOption';
import { ServiceFrecuency } from './../../../models/serviceFrecuency';
import { CoPaymentFrecuency } from './../../../models/coPaymentFrecuency';
import { PlanEntity } from './../../../models/planEntity';
import { PlanRatesService } from './../../../services/plan-rates.service';
import { PlanRate } from './../../../models/planRate';
import { EntityService } from './../../../services/entity.service';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpService } from '../../../services/http-interceptor.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { Entity } from './../../../models/entity';
import * as moment from 'moment';
import { environment } from './../../../../environments/environment';
import { PlansEntityService, AssignServiceService } from '../../../services';
import { NotifierService } from 'angular-notifier';
import { Moment } from 'moment';

@Component({
  selector: 'app-assign-service-dialog',
  templateUrl: './assign-service-dialog.component.html',
  styleUrls: ['./assign-service-dialog.component.css']
})
export class AssignServiceDialogComponent implements OnInit {
  public loading: boolean = false;
  public loadingBar: boolean = false;

  public currentPatient: number;
  public entities: Entity[];
  public planRates: PlanRate[] = [];
  public planEntities: PlanEntity[] = [];
  public professionals: SelectOption[];
  public coPaymentFrecuencies: CoPaymentFrecuency[];
  public serviceFrecuencies: ServiceFrecuency[];
  public patientService: AssignService = {
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
  };

  //Validators
  public validator = {
    contractNumber: new FormControl('', [Validators.required]),
    entity: new FormControl('', [Validators.required]),
    planEntityId: new FormControl('', [Validators.required]),
    cie10: new FormControl('', [Validators.required]),
    authorizationNumber: new FormControl('', [Validators.required]),
    validity: new FormControl('', [Validators.required]),
    applicantName: new FormControl('', [Validators.required]),
    serviceId: new FormControl('', [Validators.required]),
    quantity: new FormControl('', [Validators.required, Validators.min(1)]),
    serviceFrecuency: new FormControl('', [Validators.required]),
    initialDate: new FormControl('', [Validators.required]),
    finalDate: new FormControl('', [Validators.required]),
    professionalId: new FormControl('', [Validators.required]),
    coPaymentAmount: new FormControl('', [Validators.required, Validators.min(1)]),
    coPaymentFrecuency: new FormControl('', [Validators.required]),
    consultation: new FormControl('', [Validators.required, Validators.min(1)]),
    external: new FormControl('', [Validators.required, Validators.min(1)]),
  };

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
    this.professionals = this.data.professionals.map(pro => {
      return {
        Id: pro.ProfessionalId,
        Name: `${pro.user.FirstName} ${pro.user.SecondName || ''} ${pro.user.Surname} ${pro.user.SecondSurname || ''}`.trim().toLowerCase(),
      }
    });
  }

  ngOnInit() {
    this.loading = true;

    Observable.forkJoin(
      this.entityService.getEntities(),
      this.http.get(`${environment.apiUrl}/api/copaymentfrecuencies`).map(res => res.json()),
      this.http.get(`${environment.apiUrl}/api/servicefrecuencies`).map(res => res.json())
    ).subscribe(res => {
      this.entities = res[0];
      this.coPaymentFrecuencies = res[1];
      this.serviceFrecuencies = res[2];
      this.loading = false;
    }, err => {
      this.loading = false;
      if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' : '';
  }

  getPlansEntity(id: number): void {
    this.planEntities = [];
    this.loadingBar = true;

    this.plansEntityService.getPlansByEntity(id)
      .subscribe(data => {
        this.planEntities = data;
        this.loadingBar = false;
      }, err => {
        this.loadingBar = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
      })
  }

  getPlanRates(id: number): void {
    this.planRates = [];
    this.loadingBar = true;

    this.planRateService.getPlanRates(id)
      .subscribe(data => {
        this.planRates = data;
        this.loadingBar = false;
      }, err => {
        this.loadingBar = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
      })
  }

  calculateFinalDate(quantity: number, serviceFrecuencyId: number, initialDate: Moment): void  {
    this.loadingBar = true;

    this.assignService.calculateFinalDateAssignService(quantity, serviceFrecuencyId, initialDate.format('YYYY-DD-MM'))
      .subscribe(data => {
        this.loadingBar = false;
        this.patientService.FinalDate = moment(data.date);
      }, err => {
        this.loadingBar = false;
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

  submitForm(patientService: AssignService): void {
    patientService = Object.assign({}, patientService);
    patientService.Validity = moment(patientService.Validity).format('YYYY-MM-DD'); 
    patientService.InitialDate = moment(patientService.InitialDate).format('YYYY-MM-DD'); 
    patientService.FinalDate = moment(patientService.FinalDate).format('YYYY-MM-DD'); 
    
    this.loading = true;

    this.assignService.createOrUpdate(this.currentPatient, patientService)
      .subscribe(data => {
        this.notifier.notify('success', 'Se asigno el servico al paciente con exito');
        this.onNoClick();
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
      });
  }
}