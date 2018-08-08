import { AssignServiceDetail } from './../../../models/assignServiceDetail';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpService } from '../../../services/http-interceptor.service';
import { SelectOption } from '../../../models/selectOption';
import { environment } from '../../../../environments/environment';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-cancel-visits-dialog',
  templateUrl: './cancel-visits-dialog.component.html',
  styleUrls: ['./cancel-visits-dialog.component.css']
})
export class CancelVisitsDialogComponent implements OnInit {
  public loading: boolean = false;
  public visits: AssignServiceDetail[] = [];
  public cancelReasons: SelectOption[];

  //Validators
  public validator = {
    cancelReason: new FormControl('', [Validators.required])
  };

  constructor(
    public dialogRef: MatDialogRef<CancelVisitsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpService,
    private notifier: NotifierService
  ) {
    this.visits = this.data.visits;
  }

  ngOnInit() {
    this.loading = true;

    this.http.get(`${environment.apiUrl}/api/cancelreasons`)
      .map(res => res.json())
      .subscribe(data => {
        this.cancelReasons = data;
        this.loading = false;
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  onNoClick(visits: AssignServiceDetail[]): void {
    this.dialogRef.close(visits);
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio': '';
  }

  public formInvalid(): boolean {
    let invalid = false;

    this.visits.forEach(question => {
      invalid = !Object.keys(question).includes('cancelReasonId') || invalid;
    });

    return invalid;
  }

  submitForm(visits: AssignServiceDetail[]): void {
    this.loading = true;

    let data = {
      reasons: visits.map(visit => {
        return {
          CancelReasonId: visit.cancelReasonId,
          AssignServiceDetailId: visit.AssignServiceDetailId
        }
      })
    };

    this.http.post(`${environment.apiUrl}/api/cancelreasons`, JSON.stringify(data))
      .subscribe(() => {
        this.notifier.notify('success', 'Se cancelaron las visitas con éxito');
        this.onNoClick(visits);
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }
}