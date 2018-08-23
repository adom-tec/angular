import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import * as FileSaver from 'file-saver';
import { environment } from './../../../../environments/environment';
import { AuthenticationService } from '../../../services';
import { NotifierService } from 'angular-notifier';
import { HttpService } from './../../../services/http-interceptor.service';
import { Subject } from 'rxjs';
import { ResponseContentType } from '@angular/http';
import { SelectOption } from '../../../models/selectOption';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-professional-report',
  templateUrl: './professional-report.component.html',
  styleUrls: ['./professional-report.component.css']
})
export class ProfessionalReportComponent implements OnInit {
  public mainSpinner: boolean = false;
  public specialties: SelectOption[];
  public contractTypes: SelectOption[];
  public states: SelectOption[];
  public filters: any = {
    SpecialtyId: null,
    ContractTypeId: null,
    State: null
  }

  //Validators
  public validator = {
    specialtyId: new FormControl('', [Validators.required]),
    contractTypeId: new FormControl('', [Validators.required]),
    state: new FormControl('', [Validators.required])
  };

  //destroy observables
  private _onDestroy = new Subject<void>();

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService
  ) { }

  ngOnInit() {
    this.mainSpinner = true;

    Observable.forkJoin(
      this.http.get(`${environment.apiUrl}/api/specialties`),
			this.http.get(`${environment.apiUrl}/api/contracttypes`)
    )
    .pipe(takeUntil(this._onDestroy))
    .subscribe(res => {
      let optionAll = new SelectOption();
      optionAll.Id = 0;
      optionAll.Name = 'TODOS';

      this.specialties = [optionAll].concat(res[0].json());
      this.contractTypes = [optionAll].concat(res[1].json());
      this.states = [
        {
          Id: 0,
          Name: 'INACTIVO'
        },
        {
          Id: 1,
          Name: 'ACTIVO'
        }
      ];

      this.mainSpinner = false;
    }, err => {
      this.mainSpinner = false;
      if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' :
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

    return invalid || this.mainSpinner;
  }

  /**
   * downloadReport
   */
  public downloadReport() {
    this.mainSpinner = true;

    this.http.get(`${environment.apiUrl}/api/reports/payment`, {
      params: this.filters,
      responseType: ResponseContentType.Blob//requerido para que la response sea un blob
    })
      .pipe(takeUntil(this._onDestroy))
      .subscribe(res => {
        FileSaver.saveAs(new Blob([res.blob()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Reporte de profesionales ${moment(Date.now()).format('DD-MM-YYYY')}.xlsx`);

        this.notifier.notify('success', 'Se ha descargado un excel con la informacion solicitada');
        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }
}
