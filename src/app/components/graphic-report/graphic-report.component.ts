import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { Router } from '@angular/router';
import { ResponseContentType } from '@angular/http';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs/Observable';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import * as FileSaver from 'file-saver';

import { AssignService } from './../../models/assignService';
import { HttpService, AuthenticationService } from '../../services';
import { environment } from '../../../environments/environment';
import { ServiceChartStatus } from './../../models/serviceChartStatus';
import { PatientReportData } from '../../models/patientReportData';

@Component({
  selector: 'app-graphic-report',
  templateUrl: './graphic-report.component.html',
  styleUrls: ['./graphic-report.component.css']
})
export class GraphicReportComponent implements OnInit, AfterViewInit, OnDestroy {
  irregularServiceColumns: string[] = [];
  irregularServices = new MatTableDataSource([]);
  filterIrregularServices: string;

  withoutProfessionalColumns: string[] = [];
  withoutProfessional = new MatTableDataSource([]);
  filterWithoutProfessional: string;

  copaymentColumns: string[] = [];
  copayments = new MatTableDataSource([]);
  filterCopayments: string;

  mainSpinner: boolean = false;
  irregServicesSipinner: boolean = false;
  showChart: boolean = false;
  barChartNursingLabels: string[] = [];
  barChartNursingData: any[] = [];
  barChartTherapyLabels: string[] = [];
  barChartTherapyData: any[] = [];
  //config
  barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        categoryPercentage: 1.0,
        barPercentage: .8
      }]
    }
  };
  barChartType: string = 'bar';
  barChartLegend: boolean = true;

  @ViewChild('irregularServPager') irregularServPager: MatPaginator;
  @ViewChild('irregularServTable') irregularServTable: MatSort;
  @ViewChild('noProfessionalPager') noProfessionalPager: MatPaginator;
  @ViewChild('noProfessionalTable') noProfessionalTable: MatSort;
  @ViewChild('copaymentPager') copaymentPager: MatPaginator;
  @ViewChild('copaymentTable') copaymentTable: MatSort;

  private _onDestroy = new Subject<void>();

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.mainSpinner = true;

    Observable.forkJoin(
      this.http.get(`${environment.apiUrl}/api/getchartdata/2`),//horas de enfermeria
      this.http.get(`${environment.apiUrl}/api/getchartdata/3`), //informe de terapias
      this.http.get(`${environment.apiUrl}/api/irregularservices`),
      this.http.get(`${environment.apiUrl}/api/professionals/-1/services`), //servicios sin profesional asignado
      this.http.get(`${environment.apiUrl}/api/professionals/copayment`) //copagos sin entregar por profesional
    )
      .pipe(takeUntil(this._onDestroy))
      .subscribe(res => {
        this.mapToChartFormat(res[0].json(), this.barChartNursingData, this.barChartNursingLabels);
        this.mapToChartFormat(res[1].json(), this.barChartTherapyData, this.barChartTherapyLabels);

        this.irregularServices.data = res[2].json().map((patient: PatientReportData) => {
          return {
            AssignServiceId: patient.AssignServiceId,
            PatientId: patient.PatientId,
            PatientName: patient.PatientName,
            ServiceName: patient.ServiceName,
            Reason: patient.Reason
          }
        });
        this.irregularServiceColumns = this.irregularServices.data.length ? Object.keys(this.irregularServices.data[0]).filter(val => val !== 'PatientId') : [];

        this.withoutProfessional.data = res[3].json().map((assignService: AssignService) => {
          return {
            AssignServiceId: assignService.AssignServiceId,
            PatientId: assignService.PatientId,
            PatientName: assignService.patient.NameCompleted,
            ServiceName: assignService.service.Name
          }
        });
        this.withoutProfessionalColumns = this.withoutProfessional.data.length ? Object.keys(this.withoutProfessional.data[0]).filter(val => val !== 'PatientId') : [];

        this.copayments.data = res[4].json().map(pro => {
          return {
            NameCompleted: (pro.professional.user.FirstName + ' ' + (pro.professional.user.SecondName || '') + ' ' + pro.professional.user.Surname + ' ' + (pro.professional.user.SecondSurname || '')).trim().toUpperCase(),
            ReceivedAmount: pro.ReceivedAmount
          }
        });
        this.copaymentColumns = this.copayments.data.length ? Object.keys(this.copayments.data[0]) : [];

        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  ngAfterViewInit() {
    this.irregularServices.paginator = this.irregularServPager;
    this.irregularServices.sort = this.irregularServTable;
    this.withoutProfessional.paginator = this.noProfessionalPager;
    this.withoutProfessional.sort = this.noProfessionalTable;
    this.copayments.paginator = this.copaymentPager;
    this.copayments.sort = this.copaymentTable;
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }


  applyFilter(filterValue: string, type: string): void {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches

    switch (type) {
      case 'irregularServ':
        this.irregularServices.filter = filterValue;
        break;

      case 'noProfessional':
        this.withoutProfessional.filter = filterValue;
        break;

      case 'copayments':
        this.copayments.filter = filterValue;
        break;

      default:
        this.irregularServices.filter = filterValue;
        break;
    }
  }

  mapToChartFormat(nursing: ServiceChartStatus[], dataSource: any[], labels: string[]): void {
    let nursingStatus = [];

    //ordena el array por mes y status
    nursing = nursing.sort((a, b) => {
      return (+a.Month) > (+b.Month) ? 1 : (+a.Month) < (+b.Month) ? -1 : (+a.Status) > (+b.Status) ? -1 : (+a.Status) < (+b.Status) ? 1 : 0;
    });

    //devuelve un array con los status existentes
    nursing.map(obj => (+obj.Status)).forEach(status => {
      if (!nursingStatus.includes(status)) {
        nursingStatus.push(status);
      }
    });

    //mapea los datos a la estructura del chart
    nursingStatus.forEach(status => {
      dataSource.push({
        data: nursing.filter(obj => (+obj.Status) === status).map(obj => (+obj.Amount)),
        label: status === 1 ? 'PROGRAMADAS' : status === 2 ? 'COMPLETADAS' : 'CANCELADAS'
      });
    });

    //obtiene el nombre de los meses
    nursing
      .map(obj => obj.Month)
      .forEach(val => {
        moment.locale('es');
        let month = moment(val, 'MM').format('MMMM').toUpperCase();

        if (!labels.includes(month)) {
          labels.push(month.toUpperCase());
        }
      });

    //activa el chart
    this.showChart = true;
  }

  showMoreDatails(patientId: number, assignServiceId: number): void {
    this.router.navigate(['/assignservice'], {
      queryParams: {
        patientId: patientId,
        assignServiceId: assignServiceId
      }
    });
  }

  /**
 * downloadReport
 */
  downloadReport() {
    this.irregServicesSipinner = true;

    this.http.get(`${environment.apiUrl}/api/reports/irregularservices`, {
      responseType: ResponseContentType.Blob//requerido para que la response sea un blob
    })
      .pipe(takeUntil(this._onDestroy))
      .subscribe(res => {
        FileSaver.saveAs(new Blob([res.blob()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Reporte de servicios irregulares ${moment(Date.now()).format('DD-MM-YYYY')}.xlsx`);

        this.notifier.notify('success', 'Se ha descargado un excel con la información solicitada');
        this.irregServicesSipinner = false;
      }, err => {
        this.irregServicesSipinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }
}
