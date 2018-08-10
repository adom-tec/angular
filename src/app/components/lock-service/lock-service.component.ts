import { Component, OnInit } from '@angular/core';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Moment } from 'moment';
import * as moment from 'moment';
import { environment } from '../../../environments/environment';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-lock-service',
  templateUrl: './lock-service.component.html',
  styleUrls: ['./lock-service.component.css']
})
export class LockServiceComponent implements OnInit {
  public loading: boolean = false;
  public lockDate: Moment = null;
  public permissions: any = {
    update: false
  };

  //Validators
  public validator = {
    lockDate: new FormControl('', [Validators.required])
  };

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService
  ) { }

  ngOnInit(): void {
    this.permissions.update = this.auth.hasActionResource('Update');
    this.loading = true;

    this.http.get(`${environment.apiUrl}/api/lockservice`)
      .subscribe(res => {
        this.lockDate = moment(res.json().ServicesLockDate)
        this.loading = false;
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.loading = false;
      });
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' : '';
  }

  submitForm(date: Moment): void {
    this.loading = true;
    
    this.http.put(`${environment.apiUrl}/api/lockservice`, JSON.stringify({ ServicesLockDate: date }))
      .subscribe(res => {
        this.notifier.notify('success', 'Se aplicaron los cambios con éxito');
        this.loading = false;
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.loading = false;
      });
  }
}
