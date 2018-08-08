import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators, FormGroupDirective } from '@angular/forms';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import * as moment from 'moment';
import * as FileSaver from 'file-saver';
import { environment } from './../../../environments/environment';
import { AuthenticationService, EntityService, PlansEntityService } from '../../services';
import { NotifierService } from 'angular-notifier';
import { HttpService } from './../../services/http-interceptor.service';
import { ResponseContentType } from '@angular/http';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { Entity } from '../../models/entity';
import { PlanEntity } from '../../models/planEntity';
import { Rips } from '../../models/rips';

@Component({
  selector: 'app-rips',
  templateUrl: './rips.component.html',
  styleUrls: ['./rips.component.css']
})
export class RipsComponent implements OnInit {
  public mainSpinner: boolean = false;
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public filter: string;
  public allSelected: boolean = false;

  public entities: Entity[];
  public serviceTypes: any[];
  public plansEntity: PlanEntity[];
  public rips: Rips[];
  public filters: any = {
    InitDate: null,
    FinalDate: null,
    Entity: null,
    PlanEntity: null,
    ServiceType: null,
    InvoiceDate: null,
    InvoiceNumber: null,
    CopaymentAmount: null,
    NetWorth: null
  };
  public ripDateRage: any = {
    InitDate: null,
    FinalDate: null
  }

  //Validators
  public validator = {
    initDate: new FormControl('', [Validators.required]),
    finalDate: new FormControl('', [Validators.required]),
    entity: new FormControl('', [Validators.required]),
    planEntity: new FormControl('', [Validators.required]),
    serviceType: new FormControl('', [Validators.required])
  };

  public invoiceValidator = {
    copaymentAmount: new FormControl('', [Validators.required, Validators.min(0)]),
    netWorth: new FormControl('', [Validators.required, Validators.min(0)]),
    invoiceDate: new FormControl('', [Validators.required]),
    invoiceNumber: new FormControl('', [Validators.required])
  };

  //select filters
  public entityFilter: string = null;
  public entityFilteredData: ReplaySubject<Entity[]> = new ReplaySubject<Entity[]>(1);
  public planEntityFilter: string = null;
  public planEntityFilteredData: ReplaySubject<PlanEntity[]> = new ReplaySubject<PlanEntity[]>(1);

  //unsuscribe
  private _onDestroy = new Subject<void>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('formFilters') formFilters: FormGroupDirective;
  @ViewChild('formInvoice') formInvoice: FormGroupDirective;

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService,
    private entityService: EntityService,
    private plansEntityService: PlansEntityService
  ) { }

  ngOnInit() {
    this.mainSpinner = true;

    Observable.forkJoin(
      this.entityService.getEntities(),
      this.http.get(`${environment.apiUrl}/api/servicetypes`).map(res => res.json())
		)
      .pipe(takeUntil(this._onDestroy))
      .subscribe(data => {
        this.entities = data[0];
        this.serviceTypes = data[1];
        this.entityFilteredData.next(this.entities.slice());

        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
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
   * mapRipsToTableFormat
   */
	public mapRipsToTableFormat(data: Rips[]): void {
    this.rips = data.map(rip => {
      rip.AssignServiceId = +rip.AssignServiceId;
      return rip;
    });

		this.dataSource.data = data.map(rip => {
			return {
        isSelected: false,
        assignServiceId: +rip.AssignServiceId,
				document: rip.patient.Document,
				patient: rip.patient.NameCompleted,
        service: rip.service.Name,
        authorization: rip.AuthorizationNumber,
        entity: rip.entity.Name,
        plan: rip.plan_service.Name,
        initDate: rip.InitialDate,
        finalDate: rip.FinalDate,
        invoice: rip.InvoiceNumber
			};
		});

		this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]).filter(key => key !== 'assignServiceId') : [];
	}

  public getRips(filters: any): void {
    filters = {...filters};
    filters.InitDate = filters.InitDate.format('YYYY-MM-DD');
    filters.FinalDate = filters.FinalDate.format('YYYY-MM-DD');
    this.ripDateRage.InitDate = filters.InitDate;
    this.ripDateRage.FinalDate = filters.FinalDate;

    this.mainSpinner = true;

    this.http.get(`${environment.apiUrl}/api/rips/services`, { params: filters })
      .map(res => res.json())
      .pipe(takeUntil(this._onDestroy))
      .subscribe(data => {
        if (!data.length) {
          this.notifier.notify('info', 'No se encontraron registros con los parámetros solicitados');
        }

        this.mapRipsToTableFormat(data);

        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;

        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  /**
   * getPlans
   */
  public getPlans(entityId: number) {
    this.mainSpinner = true;

    this.plansEntityService.getPlansByEntity(entityId)
    .pipe(takeUntil(this._onDestroy))
    .subscribe(data => {
      let plan = new PlanEntity();
      plan.PlanEntityId = 0;
      plan.Name = "TODOS";

      this.plansEntity = [plan].concat(data.filter(plan => +plan.State ? true : false));
      this.filters.PlanEntity = null;
      this.planEntityFilteredData.next(this.plansEntity.slice());
      this.mainSpinner = false;
    }, err => {
      this.mainSpinner = false;

      if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
    });
  }

  /**
   * toogleState
   */
  public toogleState(row: any): void {
    row.isSelected = !row.isSelected;

    if (row.invoice && row.isSelected) {
      this.notifier.notify('info', 'El servicio ya tiene asociada una factura');
    }
  }

  /**
   * toogle state all table rows
   */
  public toogleStateAll(): void {
    this.dataSource.filteredData.forEach(row => {
      row.isSelected = this.allSelected;
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

    return invalid || this.mainSpinner;
  }

  /**
  * formInvalid
  */
  public generateActive(): boolean {
    let invalid = false;

    Object.keys(this.invoiceValidator).forEach(key => {
      invalid = this.invoiceValidator[key].invalid || invalid;
    });

    return invalid || !this.dataSource.data.some(rip => rip.isSelected) || this.mainSpinner;
  }

  /**
   * clearForm
   */
  public clearForm() {
    Object.keys(this.invoiceValidator).forEach(key => {
      this.invoiceValidator[key].reset();
    });

    this.formInvoice.resetForm();

    this.filter = null;
    this.applyFilter('');
    this.getRips(this.filters);
  }

  /**
   * downloadReport
   */
  public downloadReport() {
    let rowSelecteds = this.dataSource.data.filter(rip => rip.isSelected);

    let body = {
      InitDate: this.ripDateRage.InitDate,
      FinalDate: this.ripDateRage.FinalDate,
      InvoiceDate: this.filters.InvoiceDate.format('YYYY-MM-DD'),
      InvoiceNumber: this.filters.InvoiceNumber,
      CopaymentAmount: this.filters.CopaymentAmount,
      NetWorth: this.filters.NetWorth,
      services: rowSelecteds.map(rip => rip.assignServiceId)
    };

    if (rowSelecteds.some(rip => rip.invoice)) {
      this.notifier.notify('error', 'Se han seleccionado servicios que ya tienen asociada una factura');
      return;
    }

    this.mainSpinner = true;

    this.http.post(`${environment.apiUrl}/api/rips/services`, JSON.stringify(body), {
      responseType: ResponseContentType.Blob//requerido para que la response sea un blob
    })
      .pipe(takeUntil(this._onDestroy))
      .subscribe(res => {
        let blob = new Blob([res.blob()], { type: 'application/zip'});

        FileSaver.saveAs(blob, 'rips.zip');
        this.notifier.notify('success', 'Se han generado los rips con éxito, se descargó un comprimido con la información');
        this.clearForm();
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; } this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  //select filtro
  public selectFilterData(origin : any[], filter: ReplaySubject<any[]>, value: string): void {
    if (!origin) {
      return;
    }
    // get the search keyword
    if (!value) {
      filter.next(origin.slice());
      return;
    } else {
      value = value.toLowerCase();
    }
    // filter the professionals
    filter.next(
      origin.filter(item => item.Name.toLowerCase().indexOf(value) > -1)
    );
  }

  public resetSelectList(origin : any[], filter: ReplaySubject<any[]>): void {
    filter.next(origin.slice());
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
