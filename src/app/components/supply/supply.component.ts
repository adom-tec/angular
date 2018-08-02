import { SupplyService } from './../../services/supply.service';
import { Supply } from './../../models/supply';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialog } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-supply',
  templateUrl: './supply.component.html',
  styleUrls: ['./supply.component.css']
})
export class SupplyComponent implements OnInit {
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
  
  public currentSupply: number;
  public supply: Supply = {
    Presentation: '',
    Code: '',
    Name: '',
  }
  

  //Validators
  public validator = {
    name: new FormControl('', [Validators.required]),
    presentation: new FormControl('', [Validators.required]),
    code: new FormControl('', [Validators.required])
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private supplyService: SupplyService,
    private notifier: NotifierService
  ) { }

  ngOnInit() {
    this.permissions.create = this.auth.hasActionResource('Create');
    this.permissions.update = this.auth.hasActionResource('Update');
    this.mainSpinner = true;

    this.supplyService.getSupplies()
      .subscribe(data => {
        this.dataSource.data = data;
        this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
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
      let row = this.dataSource.data.find(supply => supply.SupplyId === id);

      this.currentSupply = id;

      Object.keys(this.supply).forEach(key => {
        this.supply[key] = row[key] ? row[key] : null;
      });

      this.supply.SupplyId = parseInt(row.SupplyId);
    }
  }

	/**
	 * hideForm
	 */
  public hideForm(): void {
    Object.keys(this.supply).forEach(key => {
      this.supply[key] = null;
    });

    this.loading = false;
    this.formActive = false;
    this.currentSupply = null;

    Object.keys(this.validator).forEach(key => {
      this.validator[key].reset();
    });

    this.mainSpinner = true;
    this.supplyService.getSupplies()
      .subscribe(data => {
        this.mainSpinner = false;
        this.dataSource.data = data;
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
  public submitForm(supply: Supply): void {
    this.loading = true;

    this.supplyService.createOrUpdate(supply, this.currentSupply)
      .subscribe(res => {
        this.notifier.notify('success', this.currentSupply ? 'Se aplicaron los cambios con éxito' : 'Se creo el insumo con éxito');
        this.hideForm();
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

}