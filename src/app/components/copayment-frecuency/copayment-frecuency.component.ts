import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { environment } from '../../../environments/environment';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-copayment-frecuency',
  templateUrl: './copayment-frecuency.component.html',
  styleUrls: ['./copayment-frecuency.component.css']
})
export class CopaymentFrecuencyComponent implements OnInit {
  public mainSpinner: boolean = false;
  public loading: boolean = false;
  public formActive: boolean = false;
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public filter: string;

  public currentCopaymentFrec: number;
  public copaymentfrecName: string;

  //Validators
  public validator = {
    copaymentfrecName: new FormControl('', [Validators.required])
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService
  ) { }

  ngOnInit() {
    this.getCopaymentFrecuencies();
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

  getCopaymentFrecuencies(): void {
    this.mainSpinner = true;

    this.http.get(`${environment.apiUrl}/api/copaymentfrecuencies`)
      .subscribe(res => {
        this.dataSource.data = res.json();
        this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
        this.mainSpinner = false;
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
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
      let row = this.dataSource.data.find(row => row.CoPaymentFrecuencyId === id);

      this.currentCopaymentFrec = id;
      this.copaymentfrecName = row.Name;
    }
  }

  /**
   * hideForm
   */
  public hideForm(): void {
    this.validator.copaymentfrecName.reset();
    this.loading = false;
    this.formActive = false;
    this.currentCopaymentFrec = null;
    this.copaymentfrecName = null;

    this.getCopaymentFrecuencies();
  }

  /**
   * formInvalid
   */
  public formInvalid(): boolean {
    return this.validator.copaymentfrecName.invalid || this.loading;
  }

  /**
   * create and update.
   */
  public submitForm(copaymentfrecName: string): void {
    this.loading = true;

    let url = `${environment.apiUrl}/api/copaymentfrecuencies`;

    url = this.currentCopaymentFrec ? url + '/' + this.currentCopaymentFrec : url;

    this.http[this.currentCopaymentFrec ? 'put' : 'post'](url, JSON.stringify({ Name: copaymentfrecName }))
      .subscribe(res => {
        this.notifier.notify('success', this.currentCopaymentFrec ? 'Se aplicaron los cambios con exito' : 'Se creo la frecuencia de copago con exito');
        this.hideForm();
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
        this.loading = false;
      });
  }
}