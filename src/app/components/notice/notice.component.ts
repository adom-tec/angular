import { Notice } from './../../models/notice';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { environment } from '../../../environments/environment';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-notice',
  templateUrl: './notice.component.html',
  styleUrls: ['./notice.component.css']
})
export class NoticeComponent implements OnInit {
  public loading: boolean = false;
  public permissions: any = {
    create: false
  };

  public notices: Notice[];
  public notice: Notice = {
    NoticeTitle: '',
    NoticeText: '',
  }

  //Validators
  public validator = {
    noticeTitle: new FormControl('', [Validators.required]),
    noticeText: new FormControl('', [Validators.required])
  };

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService
  ) { }

  ngOnInit() {
    this.permissions.create = this.auth.hasActionResource('Create');
    
    this.getNotices();
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio' : '';
  }

  getNotices(): void {
    this.loading = true;

    this.http.get(`${environment.apiUrl}/api/notices`)
      .subscribe(res => {
        this.notices = res.json();
        this.loading = false;
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.loading = false;
      });
  }

  /**
   * formInvalid
   */
  public formInvalid(): boolean {
    return this.validator.noticeTitle.invalid || this.validator.noticeText.invalid || this.loading;
  }

  /**
   * create and update.
   */
  public submitForm(notice: Notice): void {
    this.loading = true;

    this.http.post(`${environment.apiUrl}/api/notices`, JSON.stringify(notice))
      .subscribe(res => {
        this.notice.NoticeTitle = null;
        this.notice.NoticeText = null;
        this.validator.noticeTitle.reset();
        this.validator.noticeText.reset();
        this.getNotices();
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.loading = false;
      });
  }
}