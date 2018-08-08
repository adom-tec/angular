import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { environment } from '../../../environments/environment';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-service-frecuency',
  templateUrl: './service-frecuency.component.html',
  styleUrls: ['./service-frecuency.component.css']
})
export class ServiceFrecuencyComponent implements OnInit {
  public mainSpinner: boolean = false;
  public loading: boolean = false;
  public formActive: boolean = false;
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public filter: string;
  public permissions: any = {
    create: false,
    update: false
  };

  public currentServiceFrec: number;
  public servicefrecName: string;

  //Validators
  public validator = {
    servicefrecName: new FormControl('', [Validators.required])
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService
  ) { }

  ngOnInit() {
    this.permissions.create = this.auth.hasActionResource('Create');
    this.permissions.update = this.auth.hasActionResource('Update');
    this.getServiceFrecuencies();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  public applyFilter(filterValue: string): void {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio' : '';
  }

  getServiceFrecuencies(): void {
    this.mainSpinner = true;

    this.http.get(`${environment.apiUrl}/api/servicefrecuencies`)
      .subscribe(res => {
        this.dataSource.data = res.json();
        this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
        this.mainSpinner = false;
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.mainSpinner = false;
      });
  }

  /**
   * showForm
   */
  public showForm(id?: number): void {
    this.formActive = true;
    this.filter = '';
    this.applyFilter('');

    if (id) {
      let row = this.dataSource.data.find(row => row.ServiceFrecuencyId === id);

      this.currentServiceFrec = id;
      this.servicefrecName = row.Name;
    }
  }

  /**
   * hideForm
   */
  public hideForm(): void {
    this.validator.servicefrecName.reset();
    this.loading = false;
    this.formActive = false;
    this.currentServiceFrec = null;
    this.servicefrecName = null;

    this.getServiceFrecuencies();
  }

  /**
   * formInvalid
   */
  public formInvalid(): boolean {
    return this.validator.servicefrecName.invalid || this.loading;
  }

  /**
   * create and update.
   */
  public submitForm(servicefrecName: string): void {
    this.loading = true;

    let url = `${environment.apiUrl}/api/servicefrecuencies`;

    url = this.currentServiceFrec ? url + '/' + this.currentServiceFrec : url;

    this.http[this.currentServiceFrec ? 'put' : 'post'](url, JSON.stringify({ Name: servicefrecName }))
      .subscribe(res => {
        this.notifier.notify('success', this.currentServiceFrec ? 'Se aplicaron los cambios con éxito' : 'Se creo la frecuencia de servicio con éxito');
        this.hideForm();
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.loading = false;
      });
  }
}