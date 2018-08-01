import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import * as FileSaver from 'file-saver';
import { environment } from './../../../../environments/environment';
import { AuthenticationService, ProfessionalService } from '../../../services';
import { NotifierService } from 'angular-notifier';
import { Service, Professional, User } from '../../../models';
import { HttpService } from './../../../services/http-interceptor.service';
import { ReplaySubject, Subject } from 'rxjs';
import { ResponseContentType } from '@angular/http';
import { SelectOption } from '../../../models/selectOption';

@Component({
  selector: 'app-copayment-report',
  templateUrl: './copayment-report.component.html',
  styleUrls: ['./copayment-report.component.css']
})
export class CopaymentReportComponent implements OnInit {
  public mainSpinner: boolean = false;
  public professionals: SelectOption[];
  public reportTypes: any[] = [
    {
      Id: 'copayment',
      Name: 'Consolidado'
    },
    {
      Id: 'nomina',
      Name: 'Nomina'
    }
  ];
  public filters: any = {
    ProfessionalId: null,
    ReportType: null,
    InitDate: null,
    FinalDate: null
  }

  //Validators
  public validator = {
    professionalId: new FormControl('', [Validators.required]),
    reportType: new FormControl('', [Validators.required]),
    initDate: new FormControl('', [Validators.required]),
    finalDate: new FormControl('', [Validators.required])
  };

  //select filters
  public selectFilter: string = null;
  public selectFilteredData: ReplaySubject<SelectOption[]> = new ReplaySubject<SelectOption[]>(1);
  private _onDestroy = new Subject<void>();

  constructor(
    private professionalService: ProfessionalService,
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService
  ) { }

  ngOnInit() {
    this.mainSpinner = true;

    this.professionalService.getProfessionals()
      .subscribe(data => {
        let pro = new SelectOption();
        pro.Id = 0;
        pro.Name = 'TODOS';

        this.professionals = [pro].concat(data.map(pro => {
          return {
            Id: pro.ProfessionalId,
            Name: `${pro.user.FirstName} ${pro.user.SecondName || ''} ${pro.user.Surname} ${pro.user.SecondSurname || ''}`,
          }
        }));
        this.selectFilteredData.next(this.professionals.slice());

        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
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

    let params = Object.assign({}, this.filters);

    params.InitDate = params.InitDate.format('DD-MM-YYYY');
    params.FinalDate = params.FinalDate.format('DD-MM-YYYY');
    delete params.ReportType;

    this.http.get(`${environment.apiUrl}/api/reports/${this.filters.ReportType}`, {
      params: params,
      responseType: ResponseContentType.Blob//requerido para que la response sea un blob
    })
      .subscribe(res => {
        FileSaver.saveAs(new Blob([res.blob()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Reporte copagos - ${this.filters.ReportType} ${moment(Date.now()).format('DD-MM-YYYY')}.xlsx`);

        this.notifier.notify('success', 'Se ha descargado un excel con la informacion solicitada');
        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  //select professionals filtro
  private selectFilterData(value: string): void {
    if (!this.professionals) {
      return;
    }
    // get the search keyword
    if (!value) {
      this.selectFilteredData.next(this.professionals.slice());
      return;
		} else {
			value = value.toLowerCase().replace(/\s+/g, ' ');
		}
		// filter the professionals
		this.selectFilteredData.next(
			this.professionals.filter(pro => pro.Name.toLowerCase().replace(/\s+/g, ' ').indexOf(value) > -1)
		);
  }

  private resetSelectList(): void {
    this.selectFilteredData.next(this.professionals.slice());
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
