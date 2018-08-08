import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialog } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { NotifierService } from 'angular-notifier';
import { Copayment } from './../../models/copayment';
import { SelectOption } from './../../models/selectOption';
import { Professional } from './../../models/professional';
import { ProfessionalService } from '../../services';
import { environment } from '../../../environments/environment';
import { CopaymentParams } from '../../models/copayment-params';
import { CopaymentDialogComponent } from './copayment-dialog/copayment-dialog.component';
import * as moment from 'moment';
import { ReplaySubject, Subject } from 'rxjs';
import 'rxjs/add/observable/forkJoin';

@Component({
  selector: 'app-copayment',
  templateUrl: './copayment.component.html',
  styleUrls: ['./copayment.component.css']
})
export class CopaymentComponent implements OnInit {
  public mainSpinner: boolean = false;
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public filter: string;
  public formActive: boolean = false;
  public permissions: any = {
    create: false,
    update: false
  };

  public professionals: Professional[];
  public professionalsMap: SelectOption[];
  public copaymentStates: SelectOption[] = [
    {
      Id: 0,
      Name: "Sin entregar"
    },
    {
      Id: 1,
      Name: "Entregado"
    }
  ];
  public serviceStates: SelectOption[] = [
    {
      Id: 1,
      Name: "En proceso"
    },
    {
      Id: 2,
      Name: "Completado"
    },
    {
      Id: 3,
      Name: "Todos"
    }
  ];
  public copaymentParams: CopaymentParams = {
    professionalId: null,
    copaymentState: null,
    serviceState: null,
    initDate: null,
    finalDate: null
  };

  //Validators
  public validator = {
    professionalId: new FormControl('', [Validators.required]),
    copaymentState: new FormControl('', [Validators.required]),
    serviceState: new FormControl('', [Validators.required]),
    initDate: new FormControl('', [Validators.required]),
    finalDate: new FormControl('', [Validators.required])
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  //select filters
  public selectFilter: string = null;
  public selectFilteredData: ReplaySubject<SelectOption[]> = new ReplaySubject<SelectOption[]>(1);
  private _onDestroy = new Subject<void>();

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    public dialog: MatDialog,
    private notifier: NotifierService,
    private professionalService: ProfessionalService,
  ) { }

  ngOnInit() {
    this.permissions.create = this.auth.hasActionResource('Create');
    this.permissions.update = this.auth.hasActionResource('Update');

    this.mainSpinner = true;

    this.professionalService.getProfessionals()
      .subscribe(data => {
        this.professionals = data;
        this.professionalsMap = data
          .map(pro => {
            return {
              Id: pro.ProfessionalId,
              Name: `${pro.user.FirstName} ${pro.user.SecondName || ''} ${pro.user.Surname} ${pro.user.SecondSurname || ''}`,
            }
          });
        this.selectFilteredData.next(this.professionalsMap.slice());
        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; }
        this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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

  getCopayments(copaymentParams: CopaymentParams): void {
    let params = {
      ProfessionalId: copaymentParams.professionalId,
      InitDate: copaymentParams.initDate.format('YYYY-MM-DD'),
      FinalDate: copaymentParams.finalDate.format('YYYY-MM-DD'),
      StateId: copaymentParams.serviceState,
      CopaymentState: copaymentParams.copaymentState
    };

    this.mainSpinner = true;

    this.http.get(`${environment.apiUrl}/api/copayments`, { params: params })
      .map(res => res.json())
      .subscribe((data: Copayment[]) => {
        if (!data.length) {
          this.notifier.notify('info', 'No se encontraron registros con los parametros de busqueda');
        }

        this.dataSource.data = copaymentParams.copaymentState === 0 ? data.map(copayment => Object.assign({ isSelected: false}, copayment)) : data;
        this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]).filter(col => !['AssignServiceId', 'professional_rate_id'].includes(col)) : [];
        this.mainSpinner = false;
      }, err => {
        this.mainSpinner = false;
        if (err.status === 401) { return; }
        this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

  /**
   * toogleState
   */
  public toogleState(row: Copayment) {
    row.isSelected = !row.isSelected;
  }

  openDialog(): void {
    let dialogRef = this.dialog.open(CopaymentDialogComponent, {
      width: '1000px',
      height: '600px',
      panelClass: 'myapp-position-relative-dialog',
      data: {
        professional: this.professionals.find(pro => pro.ProfessionalId === this.copaymentParams.professionalId),
        copaymentParams: this.copaymentParams,
        copayments: this.dataSource.data.filter(copayment => copayment.isSelected).map(copayment => Object.assign({}, copayment))
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataSource.data = [];
        this.notifier.notify('success', 'Copagos entregados con éxito, se ha descargado un pdf con la informacion');
      }
    });
  }

  nothingSelected(): boolean {
    return !this.dataSource.data.some(copayment => copayment.isSelected);
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

  public selectFilterData(value: string): void {
    if (!this.professionalsMap) {
      return;
    }
    // get the search keyword
    if (!value) {
      this.selectFilteredData.next(this.professionalsMap.slice());
      return;
		} else {
			value = value.toLowerCase().replace(/\s+/g, ' ');
		}
		// filter the professionals
		this.selectFilteredData.next(
			this.professionalsMap.filter(pro => pro.Name.toLowerCase().replace(/\s+/g, ' ').indexOf(value) > -1)
		);
  }

  public resetSelectList(): void {
    this.selectFilteredData.next(this.professionalsMap.slice());
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
