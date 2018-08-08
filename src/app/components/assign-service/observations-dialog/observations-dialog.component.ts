import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup, FormGroupDirective } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpService } from '../../../services/http-interceptor.service';
import { ObservationService, AuthenticationService } from '../../../services';
import { Observation } from '../../../models/observation';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-observations-dialog',
  templateUrl: './observations-dialog.component.html',
  styleUrls: ['./observations-dialog.component.css']
})
export class ObservationsDialogComponent implements OnInit {
  public mainSpinner: boolean = false;
  public permissions: any = {
    update: false
  };

  public currentService: number;
  public observations: Observation[];
  public obvs: Observation = {
    Description: ''
  }

  //Validators
  public validator = {
    description: new FormControl('', [Validators.required])
  };

  @ViewChild('formDirective') myNgForm: FormGroupDirective;

  constructor(
    public dialogRef: MatDialogRef<ObservationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpService,
    private auth: AuthenticationService,
    private obvsService: ObservationService,
    private notifier: NotifierService
  ) {
    this.currentService = this.data.assignServiceId;
  }

  ngOnInit() {
    this.permissions.update = this.auth.hasActionResource('Update', '/assignservice');
    this.mainSpinner = true;

    this.obvsService.getObservations(this.currentService)
      .subscribe(data => {
        this.observations = data;
        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio' : '';
  }

  /**
	 * formInvalid
	 */
  public formInvalid(): boolean {
    return this.validator.description.invalid;
  }

  submitForm(obvs: any): void {
    this.mainSpinner = true;

    this.obvsService.createOrUpdate(this.currentService, obvs)
      .subscribe(res => {
        this.observations.push(res.json());
        this.mainSpinner = false;
        this.notifier.notify('success', 'Se creo la observacion con éxito');
        this.clearForm();
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  delete(id: number): void {
    this.mainSpinner = true;

    this.obvsService.delete(this.currentService, id)
      .subscribe(res => {
        this.mainSpinner = false;
        this.observations = this.observations.filter(obvs => obvs.AssignServiceObservationId !== id);
        this.notifier.notify('success', 'Se elimino la observacion con éxito');
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  clearForm(): void {
    Object.keys(this.validator).forEach(key => {
      this.validator[key].reset();
    });

    this.myNgForm.resetForm();
  }
}