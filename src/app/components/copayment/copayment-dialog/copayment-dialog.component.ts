import { Professional } from './../../../models/professional';
import { AssignService } from './../../../models/assignService';
import { SelectOption } from './../../../models/selectOption';
import { ServiceFrecuency } from './../../../models/serviceFrecuency';
import { CoPaymentFrecuency } from './../../../models/coPaymentFrecuency';
import { PlanEntity } from './../../../models/planEntity';
import { PlanRatesService } from './../../../services/plan-rates.service';
import { PlanRate } from './../../../models/planRate';
import { EntityService } from './../../../services/entity.service';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { HttpService } from '../../../services/http-interceptor.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { Entity } from './../../../models/entity';
import * as moment from 'moment';
import { environment } from './../../../../environments/environment';
import { PlansEntityService, AssignServiceService } from '../../../services';
import { NotifierService } from 'angular-notifier';
import { Moment } from 'moment';
import { CopaymentParams } from '../../../models/copayment-params';
import { Copayment } from '../../../models/copayment';
import { ResponseContentType } from '@angular/http';

@Component({
  selector: 'app-copayment-dialog',
  templateUrl: './copayment-dialog.component.html',
  styleUrls: ['./copayment-dialog.component.css']
})
export class CopaymentDialogComponent implements OnInit {
  public mainSpinner: boolean = false;
  public loading: boolean = false;
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public filter: string;

  public currentProfessional: Professional;
  public currentCopaymentParams: CopaymentParams;
  public currentCopayments: Copayment[];
  public today: number;
  public observations: string;
  public professionalTakenAmount: number = 0;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  //Validators
  public validator = {
    professionalTakenAmount: new FormControl('', [Validators.min(0)])
  };

  constructor(
    public dialogRef: MatDialogRef<CopaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpService,
    private entityService: EntityService,
    private planRateService: PlanRatesService,
    private plansEntityService: PlansEntityService,
    private assignService: AssignServiceService,
    private notifier: NotifierService
  ) {
    this.currentProfessional = this.data.professional;
    this.currentCopaymentParams = this.data.copaymentParams;
    this.currentCopayments = this.data.copayments;
    this.today = Date.now();
  }

  ngOnInit() {
    this.dataSource.data = this.currentCopayments;
    this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]).filter(col => !['AssignServiceId', 'isSelected', 'professional_rate_id'].includes(col)) : [];
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

  onNoClick(ok: boolean): void {
    this.dialogRef.close(ok);
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 0' : '';
  }

  getSumValues(key: string): number {
    return this.currentCopayments.map(copayment => copayment[key]).reduce((a, b) => a + b);
  }

  submitForm(): void {
    if ((this.getSumValues('TotalCopaymentDelivered') - this.professionalTakenAmount) < 0) {
      this.notifier.notify('error', 'El monto conservado por el profesional no puede ser mayor al total a entregar');
      return;
    }

    let services = this.dataSource.data.map((copayment: Copayment) => {
      return {
        AssignServiceId: copayment.AssignServiceId,
        professional_rate_id: copayment.professional_rate_id
      };
    });
    let params = {
      ProfessionalId: this.currentCopaymentParams.professionalId,
      InitDate: this.currentCopaymentParams.initDate.format('YYYY-MM-DD'),
      FinalDate: this.currentCopaymentParams.finalDate.format('YYYY-MM-DD'),
      StateId: this.currentCopaymentParams.serviceState,
      CopaymentState: this.currentCopaymentParams.copaymentState
    };
    let body = {
      services: services,
      observation: this.observations,
      professional_taken_amount: this.professionalTakenAmount
    };

    this.loading = true;

    this.http.put(`${environment.apiUrl}/api/copayments/${this.currentProfessional.ProfessionalId}`, JSON.stringify(body), {
      params: params,
      responseType: ResponseContentType.Blob//requerido para que la response sea un blob
    })
      .subscribe(res => {
        //generar blob
        let data = {
          filename: `cuenta de cobro ${moment(this.today).format('DD-MM-YYYY')}.pdf`,
          data: res.blob()
        };
        //descargar pdf
        var url = window.URL.createObjectURL(data.data);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.download = data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove(); // remove the element

        //cerrar modal
        this.onNoClick(true);
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }
}
