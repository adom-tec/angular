import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpService } from '../../../services/http-interceptor.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { Supply, AssignServiceSupply } from '../../../models';
import { SelectOption } from '../../../models/selectOption';
import { environment } from '../../../../environments/environment';
import { SupplyService, AssignServiceSupplyService } from '../../../services';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-service-supply-dialog',
  templateUrl: './service-supply-dialog.component.html',
  styleUrls: ['./service-supply-dialog.component.css']
})
export class ServiceSupplyDialogComponent implements OnInit {
  public loading: boolean = false;
  public currentService: number;
  public suplies: Supply[];
  public billedToOptions: SelectOption[];
  public serviceSupply: AssignServiceSupply = {
    SupplyId: null,
    Quantity: 1,
    BilledToId: null
  };

  //Validators
  public validator = {
    supplyId: new FormControl('', [Validators.required]),
    quantity: new FormControl('', [Validators.required, Validators.min(1)]),
    billedToId: new FormControl('', [Validators.required])
  };

  constructor(
    public dialogRef: MatDialogRef<ServiceSupplyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpService,
    private supplyService: SupplyService,
    private assignServiceSupplyService: AssignServiceSupplyService,
    private notifier: NotifierService
  ) {
    this.currentService = this.data.assignServiceId;
  }

  ngOnInit() {
    this.loading = true;
    Observable.forkJoin(
      this.http.get(`${environment.apiUrl}/api/billedto`).map(res => res.json()),
      this.supplyService.getSupplies()
    ).subscribe(res => {
      this.billedToOptions = res[0];
      this.suplies = res[1];
      this.loading = false;
    }, err => {
      if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
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

	  return invalid;
  }

  submitForm(serviceSupply: AssignServiceSupply): void {
    this.loading = true;

    this.assignServiceSupplyService.createOrUpdate(this.currentService, serviceSupply)
      .subscribe(() => {
        this.notifier.notify('success', 'Se agrego el insumo con éxito');
        this.onNoClick();
      }, err => {
        this.loading = false;
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuniquese con el administrador se sistema.' : err.json().message ? err.json().message : 'No se pudo obtener la informacion, por favor intente nuevamente');
      });
  }
}