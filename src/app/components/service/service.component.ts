import { SelectOption } from './../../models/selectOption';
import { ServicesService } from './../../services/services.service';
import { Service } from './../../models/service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialog } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { environment } from '../../../environments/environment';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent implements OnInit {
  public loading: boolean = false;
  public mainSpinner: boolean = false;
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public filter: string;
  public formActive: boolean = false;
  public permissions: any = {
    create: false,
    update: false
  };
  
  public currentService: number;
  public serviceTypes: SelectOption;
  public clasifications: SelectOption;
  public services: Service[];
  public service: Service = {
    Name: '',
    Value: 1,
    special_value: 1,
    particular_value: 1,
    holiday_value: 1,
    Code: '',
    ClassificationId: null,
    ServiceTypeId: null,
    HoursToInvest: 1
  }

  //Validators
  public validator = {
    name: new FormControl('', [Validators.required]),
    value: new FormControl('', [Validators.required, Validators.min(1)]),
    special_value: new FormControl('', [Validators.required, Validators.min(1)]),
    particular_value: new FormControl('', [Validators.required, Validators.min(1)]),
    holiday_value: new FormControl('', [Validators.required, Validators.min(1)]),
    code: new FormControl('', [Validators.required]),
    classificationId: new FormControl('', [Validators.required]),
    serviceTypeId: new FormControl('', [Validators.required]),
    hoursToInvest: new FormControl('', [Validators.required, Validators.min(1)])
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private servicesService: ServicesService,
    private notifier: NotifierService
  ) { }

  ngOnInit() {
    this.permissions.create = this.auth.hasActionResource('Create');
    this.permissions.update = this.auth.hasActionResource('Update');
    this.mainSpinner = true;
    
    Observable.forkJoin(
      this.servicesService.getServices(),
      this.http.get(`${environment.apiUrl}/api/classifications`),
      this.http.get(`${environment.apiUrl}/api/servicetypes`)
    ).subscribe(res => {
      this.services = res[0];
      this.dataSource.data = this.servicesService.mapToTableFormat(res[0]);
      this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
      this.clasifications = res[1].json();
      this.serviceTypes = res[2].json();
      this.mainSpinner = false;
    }, err => {
      if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      this.mainSpinner = false;
    });
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
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' : '';
  }

	/**
   * showForm
   */
  public showForm(id?: number): void {
    this.formActive = true;
    this.filter = '';
    this.applyFilter('');

    if (id) {
      let row = this.services.find(service => service.ServiceId === id);

      this.currentService = id;

      Object.keys(this.service).forEach(key => {
        this.service[key] = row[key] ? row[key] : null;
      });

      this.service.ClassificationId = (+row.ClassificationId)
      this.service.ServiceTypeId = (+row.ServiceTypeId)
    }
  }

	/**
	 * hideForm
	 */
  public hideForm(): void {
    Object.keys(this.service).forEach(key => {
      this.service[key] = null;
    });

    this.loading = false;
    this.formActive = false;
    this.currentService = null;

    Object.keys(this.validator).forEach(key => {
      this.validator[key].reset();
    });

    this.mainSpinner = true;
    this.servicesService.getServices()
      .subscribe(data => {
        this.mainSpinner = false;
        this.services = data;
        this.dataSource.data = this.servicesService.mapToTableFormat(data);
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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

	/**
	 * create and update.
	 */
  public submitForm(service: Service): void {
    this.loading = true;

    this.servicesService.createOrUpdate(service, this.currentService)
      .subscribe(res => {
        this.notifier.notify('success',this.currentService ? 'Se aplicaron los cambios con éxito' : 'Se creo el servicio con éxito');
        this.hideForm();
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

}
