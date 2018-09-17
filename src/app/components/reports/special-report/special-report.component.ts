import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import * as FileSaver from 'file-saver';
import { environment } from './../../../../environments/environment';
import { AuthenticationService } from '../../../services';
import { NotifierService } from 'angular-notifier';
import { Service } from '../../../models';
import { SelectOption } from './../../../models/selectOption';
import { Entity } from './../../../models/entity';
import { HttpService } from './../../../services/http-interceptor.service';
import { EntityService } from './../../../services/entity.service';
import { ServicesService } from './../../../services/services.service';
import { Moment } from 'moment';
import { ReplaySubject, Subject } from 'rxjs';
import { ResponseContentType } from '@angular/http';

@Component({
  selector: 'app-special-report',
  templateUrl: './special-report.component.html',
  styleUrls: ['./special-report.component.css']
})
export class SpecialReportComponent implements OnInit {
  public mainSpinner: boolean = false;
  public services: Service[];
  public entities: Entity[];
  public patientTypes: SelectOption[];
  public serviceTypes: SelectOption[];
  public reportTypes: any[] = [
    {
      Id: 'consolidado',
      Name: 'Consolidado'
    },
    {
      Id: 'detalle',
      Name: 'Detallado'
    }
  ];
  public filters: any = {
    ServiceId: null,
    EntityId: null,
    PatientType: null,
    ServiceType: 0,
    ReportType: null,
    InitDate: null,
    FinalDate: null
  }

  //Validators
  public validator = {
    serviceId: new FormControl('', [Validators.required]),
    entityId: new FormControl('', [Validators.required]),
    patientType: new FormControl('', [Validators.required]),
    serviceType: new FormControl('', [Validators.required]),
    reportType: new FormControl('', [Validators.required]),
    initDate: new FormControl('', [Validators.required]),
    finalDate: new FormControl('', [Validators.required])
  };

  //select filters
  public filterServices: string = null;
  public filteredServices: ReplaySubject<Service[]> = new ReplaySubject<Service[]>(1);
  public filterEntities: string = null;
  public filteredEntities: ReplaySubject<Entity[]> = new ReplaySubject<Entity[]>(1);
  private _onDestroy = new Subject<void>();

  constructor(
    private servicesService: ServicesService,
    private entityService: EntityService,
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService
  ) { }

  ngOnInit() {
    this.mainSpinner = true;

    Observable.forkJoin(
      this.servicesService.getServices(),
      this.entityService.getEntities(),
      this.http.get(`${environment.apiUrl}/api/patienttypes`),
      this.http.get(`${environment.apiUrl}/api/servicetypes`)
    ).subscribe(res => {
      let service = new Service();
      service.Name = 'TODOS';
      service.ServiceId = 0;

      let entity = new Entity();
      entity.Name = 'TODOS';
      entity.EntityId = 0;

      let option = new SelectOption();
      option.Id = 0;
      option.Name = 'TODOS';

      this.services = [service].concat(res[0]);
      this.entities = [entity].concat(res[1]);
      this.patientTypes = [option].concat(res[2].json());
      this.serviceTypes = [Object.assign({}, option)].concat(res[3].json());
      this.filteredServices.next(this.services.slice());
      this.filteredEntities.next(this.entities.slice());

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
   * disableServices
   */
  public disableServices(serviceTypeId: number): void {
    if (serviceTypeId !== 0) {
      this.filters.ServiceId = 0;
    }
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

    let params = Object.assign({}, this.filters);

    params.InitDate = params.InitDate.format('DD-MM-YYYY');
    params.FinalDate = params.FinalDate.format('DD-MM-YYYY');
    delete params.ReportType;

    this.http.get(`${environment.apiUrl}/api/reports/${this.filters.ReportType}`, {
      params: params,
      responseType: ResponseContentType.Blob//requerido para que la response sea un blob
    })
      .subscribe(res => {
        FileSaver.saveAs(new Blob([res.blob()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Reporte especial - ${this.filters.ReportType} - ${moment(Date.now()).format('DD-MM-YYYY')}.xlsx`);

        this.notifier.notify('success', 'Se ha descargado un excel con la información solicitada');
        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  //select professinals filtro
  public selectFilterData(selectFilterSubject: ReplaySubject<any[]>, dataSource: any[], value: string): void {
    if (!dataSource) {
      return;
    }
    // get the search keyword
    if (!value) {
      selectFilterSubject.next(dataSource.slice());

      return;
    } else {
      value = value.toLowerCase();
    }
    // filter the professionals
    selectFilterSubject.next(
      dataSource.filter(val => val.Name ? val.Name.toLowerCase().indexOf(value) > -1 : false)
    );
  }

  public resetSelectList(selectFilterSubject: ReplaySubject<any[]>, dataSource: any[]): void {
    selectFilterSubject.next(dataSource.slice());
    this.changeTopPosition();
  }

  private changeTopPosition(): void {
    setTimeout(() => {
      let nodes = document.getElementsByClassName('cdk-overlay-pane');
      let cardTop = document.querySelector('.mat-card').getBoundingClientRect().top;

      for (let i=0; i < nodes.length; i++) {
        if (nodes[i].clientHeight) {
          let panelTop = nodes[i].getBoundingClientRect().top;
          if (panelTop < cardTop) {
            (nodes[i] as HTMLElement).style.top = '200px';
          }
        }
      }
    }, 100);
  }
}
