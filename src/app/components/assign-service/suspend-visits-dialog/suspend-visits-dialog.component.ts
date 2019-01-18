import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NotifierService } from 'angular-notifier';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HttpService } from '../../../services/http-interceptor.service';
import { AssignServiceDetail } from './../../../models/assignServiceDetail';
import { SelectOption } from '../../../models/selectOption';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-suspend-visits-dialog',
  templateUrl: './suspend-visits-dialog.component.html',
  styleUrls: ['./suspend-visits-dialog.component.css']
})
export class SuspendVisitsDialogComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  visits: AssignServiceDetail[] = [];
  reasons: SelectOption[];

  private onDestroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<SuspendVisitsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private http: HttpService,
    private notifier: NotifierService
  ) {
    this.visits = this.data.visits;
  }

  ngOnInit() {
    this.loading = true;

    this.http.get(`${environment.apiUrl}/api/reasonsuspensionservice`)
      .map(res => res.json())
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(data => {
        this.reasons = data.map(reason => new SelectOption(reason));
        this.loading = false;
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onNoClick(visits: AssignServiceDetail[]): void {
    this.dialogRef.close(visits);
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' : '';
  }

  formInvalid(): boolean {
    let invalid = false;

    this.visits.forEach(visit => {
      invalid = !Object.keys(visit).includes('ReasonSuspensionId') || invalid;
    });

    return invalid;
  }

  submitForm(): void {
    this.loading = true;

    let data = {
      reasons: this.visits.map(visit => {
        return {
          ReasonSuspensionId: visit.ReasonSuspensionId,
          AssignServiceDetailId: visit.AssignServiceDetailId
        }
      })
    };

    this.http.post(`${environment.apiUrl}/api/reasonsuspensionservicedetail`, JSON.stringify(data))
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.notifier.notify('success', 'Se suspendieron las visitas con éxito');
        this.onNoClick(this.visits);
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }
}
