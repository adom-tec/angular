import { AssignService } from './../../../models/assignService';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpService } from '../../../services/http-interceptor.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { Supply, AssignServiceSupply, CoPaymentFrecuency } from '../../../models';
import { SelectOption } from '../../../models/selectOption';
import { environment } from '../../../../environments/environment';
import { SupplyService, AssignServiceSupplyService, AssignServiceService } from '../../../services';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-edit-assigned-service-dialog',
  templateUrl: './edit-assigned-service-dialog.component.html',
  styleUrls: ['./edit-assigned-service-dialog.component.css']
})
export class EditAssignedServiceDialogComponent implements OnInit {
  public loading: boolean = false;
  public currentAssignedService: AssignService;
  public coPaymentFrecuencies: CoPaymentFrecuency[];
  public currentPatient: number;

  //Validators
  public validator = {
    authorizationNumber: new FormControl('', [Validators.required]),
    coPaymentAmount: new FormControl('', [Validators.required, Validators.min(1)]),
    coPaymentFrecuency: new FormControl('', [Validators.required])
  };

  constructor(
    public dialogRef: MatDialogRef<EditAssignedServiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpService,
    private assignService: AssignServiceService,
    private notifier: NotifierService
  ) {
    this.currentAssignedService = this.data.assignedService;
    this.currentAssignedService.CoPaymentFrecuencyId = (+this.currentAssignedService.CoPaymentFrecuencyId);
    this.currentPatient = this.data.patientId;
  }

  ngOnInit() {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/api/copaymentfrecuencies`).map(res => res.json())
      .subscribe(data => {
        this.loading = false;
        this.coPaymentFrecuencies = data;
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  onNoClick(data: AssignService): void {
    this.dialogRef.close(data);
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio' : 
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' : '';
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

  submitForm(assignedService: AssignService): void {
    this.loading = true;

    this.assignService.createOrUpdate(this.currentPatient, assignedService, assignedService.AssignServiceId)
      .subscribe(res => {
        this.notifier.notify('success', 'Se aplicaron los cambios con éxito');
        this.onNoClick(res.json());
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }
}