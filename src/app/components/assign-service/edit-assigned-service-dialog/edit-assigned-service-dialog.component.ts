import { Component, OnInit, Inject } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NotifierService } from 'angular-notifier';
import { catchError, map, tap, takeUntil, pluck } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { AssignService } from './../../../models/assignService';
import { HttpService } from '../../../services/http-interceptor.service';
import { CoPaymentFrecuency } from '../../../models';
import { environment } from '../../../../environments/environment';
import { AssignServiceService } from '../../../services';
import { ServiceFrecuency } from '../../../models/serviceFrecuency';
import { SelectOption } from '../../../models/selectOption';

@Component({
  selector: 'app-edit-assigned-service-dialog',
  templateUrl: './edit-assigned-service-dialog.component.html',
  styleUrls: ['./edit-assigned-service-dialog.component.css']
})
export class EditAssignedServiceDialogComponent implements OnInit {
  loading: boolean = false;
  currentAssignedService: AssignService;
  copaymentFrecuencies$: Observable<CoPaymentFrecuency[]>;
  serviceFrecuencies$: Observable<ServiceFrecuency[]>;
  changeReasons$: Observable<SelectOption[]>;
  form: FormGroup;
  showServiceInitDate: boolean;
  hideChangeReasons: boolean = true;

  private patientId: number;
  private onDestroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<EditAssignedServiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private http: HttpService,
    private asgServService: AssignServiceService,
    private notifier: NotifierService,
    private formBuilder: FormBuilder
  ) {
    const firstVistiState = +this.data.serviceFirstVisit.StateId;

    this.showServiceInitDate = firstVistiState === 1 ? true : false;
    this.currentAssignedService = this.data.assignedService;
    this.currentAssignedService.CoPaymentFrecuencyId = +this.currentAssignedService.CoPaymentFrecuencyId;
    this.currentAssignedService.ServiceFrecuencyId = +this.currentAssignedService.ServiceFrecuencyId;
    this.currentAssignedService.CoPaymentAmount = +this.currentAssignedService.CoPaymentAmount;
    this.patientId = this.data.patientId;
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      ServiceFrecuencyId: [{ value: this.currentAssignedService.ServiceFrecuencyId, disabled: true }, [Validators.required]],
      FinalDate: [{ value: this.currentAssignedService.FinalDate, disabled: true }, [Validators.required]],
      CoPaymentFrecuencyId: [{ value: this.currentAssignedService.CoPaymentFrecuencyId, disabled: true }, [Validators.required]],
      CoPaymentAmount: [this.currentAssignedService.CoPaymentAmount, [Validators.required, Validators.min(0)]],
      //visibles solo si el servicio no esta iniciado
      InitialDate: [this.currentAssignedService.InitialDate],
      ReasonChangeInitDateId: [{ value: null, disabled: true }]
    });

    //si la vista no esta iniciada se establece como requerido la fecha de inicio para poder editar
    if (this.showServiceInitDate) {
      this.form.get('InitialDate').setValidators(Validators.required);
      this.form.get('InitialDate').updateValueAndValidity();
    }

    this.changeReasons$ = this.http.get(`${environment.apiUrl}/api/reasonchangeinitdate`)
      .pipe(
        map(res => res.json().map(item => new SelectOption(item))),
        tap(() => this.form.get('ReasonChangeInitDateId').enable()),
        catchError(this.handleError()),
      );

    this.copaymentFrecuencies$ = this.http.get(`${environment.apiUrl}/api/copaymentfrecuencies`)
      .pipe(
        map(res => <CoPaymentFrecuency[]>res.json()),
        tap(() => this.form.get('ServiceFrecuencyId').enable()),
        catchError(this.handleError()),
      );

    this.serviceFrecuencies$ = this.http.get(`${environment.apiUrl}/api/servicefrecuencies`)
      .pipe(
        map(res => <ServiceFrecuency[]>res.json()),
        tap(() => this.form.get('CoPaymentFrecuencyId').enable()),
        catchError(this.handleError())
      );

    this.form.get('InitialDate').valueChanges
      .pipe(
        takeUntil(this.onDestroy$),
      )
      .subscribe(date => {
        let diff = moment(this.currentAssignedService.InitialDate).diff(date);
        this.hideChangeReasons = diff ? false : true;

        //si se modifica la fecha de inicio se establece como requerido ReasonChangeInitDateId para poder editar
        if (this.hideChangeReasons) {
          this.form.get('ReasonChangeInitDateId').clearValidators();
        } else {
          this.form.get('ReasonChangeInitDateId').setValidators(Validators.required);
        }

        this.form.get('ReasonChangeInitDateId').updateValueAndValidity();
      });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  handleError(): (err) => Observable<any> {
    return (err) => {
      let message = err.status >= 500
        ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema'
        : err.json().message
          ? err.json().message
          : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente';

      if (err.status === 401) { return; }

      this.notifier.notify('error', message);

      return Observable.throw('ocurrio un error');
    }
  }

  calculateFinalDate(): void {
    let initialDate = this.form.get('InitialDate').value;

    if (initialDate) {
      let quantity = this.currentAssignedService.Quantity;
      let serviceFrecuency = this.form.get('ServiceFrecuencyId').value;
      initialDate = moment(initialDate).format('YYYY-DD-MM');

      this.loading = true;

      this.asgServService.calculateFinalDateAssignService(quantity, serviceFrecuency, initialDate)
        .pipe(
          takeUntil(this.onDestroy$),
          pluck('date'),
          tap(() => this.loading = false)
        )
        .subscribe(date => this.form.patchValue({ FinalDate: moment(date) }));
    }
  }

  onNoClick(data: AssignService): void {
    this.dialogRef.close(data);
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' : '';
  }

  submitForm(): void {
    let formData = this.form.getRawValue();
    let assignedService = Object.assign(this.currentAssignedService, formData);

    this.loading = true;

    this.asgServService.createOrUpdate(this.patientId, assignedService, assignedService.AssignServiceId)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(res => {
        this.notifier.notify('success', 'Se aplicaron los cambios con éxito');
        this.onNoClick(res.json());
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }
}
