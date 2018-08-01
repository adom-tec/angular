import { environment } from './../../../../environments/environment';
import { PlanRate } from './../../../models/planRate';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup, FormGroupDirective } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { HttpService } from '../../../services/http-interceptor.service';
import { Service } from './../../../models/service';
import { PlanEntity } from './../../../models/planEntity';
import { PlanRatesService, PlansEntityService } from '../../../services';
import * as moment from 'moment';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { ReplaySubject } from 'rxjs';

@Component({
	selector: 'app-plans-rates',
	templateUrl: './plans-rates.component.html',
	styleUrls: ['./plans-rates.component.css']
})
export class PlansRatesDialog implements OnInit {
	public loading: boolean = false;
	public displayedColumns: string[] = ['PlanRateId', 'serviceName', 'Rate', 'Validity'];
	public dataSource = new MatTableDataSource([]);
	public filter: string;
	public plansByEntity: PlanEntity[] = [];
	public services: Service[];
	public planRates: PlanRate[];
	public currentEntiy: number;
	public currentPlanEntiy: number;
	public currentPlanRate: number = null;
	public newPlanEntity: boolean = false;
	public planRate: PlanRate = {
		ServiceId: null,
		Rate: 0,
		Validity: null
	};
	public planEntity: PlanEntity = {
		EntityId: null,
		Name: '',
		State: 1
  };

  //select filters
  public selectFilter: string = null;
  public selectFilteredData: ReplaySubject<Service[]> = new ReplaySubject<Service[]>(1);

	//Validators
	public validator = {
		planName: new FormControl('', [Validators.required]),
		currentPlanEntiy: new FormControl('', [Validators.required]),
		serviceId: new FormControl('', [Validators.required]),
		rate: new FormControl('', [Validators.required, Validators.min(0)]),
		validity: new FormControl('', [Validators.required]),
	};

	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(MatSort) sort: MatSort;
	@ViewChild('formDirective') myNgForm: FormGroupDirective;

	constructor(
		public dialogRef: MatDialogRef<PlansRatesDialog>,
		@Inject(MAT_DIALOG_DATA) public data: any,
		private http: HttpService,
		private plansEntityService: PlansEntityService,
		private planRatesService: PlanRatesService,
		private notifier: NotifierService
	) {
		this.currentEntiy = this.data.entity;
		this.planEntity.EntityId = this.currentEntiy;
	}

	ngOnInit() {
		this.loading = true;

		Observable.forkJoin(
			this.plansEntityService.getPlansByEntity(this.currentEntiy),
			this.http.get(`${environment.apiUrl}/api/services`).map(res => res.json())
		).subscribe(res => {
			this.plansByEntity = res[0].map(plan => {
				plan.State = (+plan.State);
				return plan;
			});
      this.services = res[1];
      this.selectFilteredData.next(this.services.slice());
			this.loading = false;
		}, err => {
			this.loading = false;
			if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
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

	onNoClick(): void {
		this.dialogRef.close();
	}

	getErrorMessage(formcontrol): string {
		return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
			formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' : '';
	}

	toogleNewPlanEntity(): void {
		this.currentPlanEntiy = null;
		this.planEntity.Name = null;
		this.dataSource.data = [];
		this.validator.currentPlanEntiy.reset();
		this.validator.planName.reset();
		this.newPlanEntity = !this.newPlanEntity;
	}

	createPlan(plan: PlanEntity): void {
		this.loading = true;
		this.plansEntityService.createOrUpdate(plan)
			.map(res => res.json())
			.subscribe(data => {
				this.plansByEntity.push(data)
				this.toogleNewPlanEntity();
				this.loading = false;
				this.notifier.notify('success', 'Se creo el plan con exito');
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

	getPlanEntityState(id: number): boolean {
		return this.plansByEntity.find(plan => plan.PlanEntityId === id).State ? true : false;
	}

	/**
	 * activa o desactiva un plan
	 */
	toogleStatePlanEntity(id: number): void {
		let planEntity = this.plansByEntity.find(plan => plan.PlanEntityId === id)
		planEntity.State = planEntity.State === 1 ? 0 : 1;

		this.loading = true;

		this.plansEntityService.createOrUpdate(planEntity, id)
			.map(res => res.json())
			.subscribe(data => {
				this.loading = false;
				this.notifier.notify('success', 'Se cambio el estado del plan con exito');
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

	getPlanRates(planEntityId: number, clear: boolean = true): void {
		this.loading = true;

		if (clear) {
			this.dataSource.data = []
		}

		this.planRatesService.getPlanRates(planEntityId)
			.subscribe(data => {
				this.planRates = data;
				this.dataSource.data = data.map((plan: PlanRate) => {
					return {
						PlanRateId: plan.PlanRateId,
						PlanEntityId: plan.PlanEntityId,
						service: plan.service,
						serviceName: plan.service.Name,
						Rate: plan.Rate,
						Validity: moment(plan.Validity).format('DD/MM/YYYY'),
					}
				});
				this.clearAddPlanrate();
				this.loading = false;
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

	addPlanRateInvalid(): boolean {
		return !(this.validator.serviceId.valid && this.validator.rate.valid && this.validator.validity.valid);
	}

	clearAddPlanrate(): void {
		Object.keys(this.planRate).forEach(key => {
			this.planRate[key] = null;
		});

		this.validator.serviceId.reset();
		this.validator.rate.reset();
		this.validator.validity.reset();
		this.currentPlanRate = null;
	}

	addPlanRate(planRate: PlanRate): void {
		this.loading = true;

		this.planRatesService.createOrUpdate(planRate, this.currentPlanEntiy, this.currentPlanRate)
			.map(res => res.json())
			.subscribe(data => {
				this.notifier.notify('success', this.currentPlanRate ? 'Se aplicaron los cambios con exito' : 'Se creo la tarifa de servicio con exito');
				this.getPlanRates(this.currentPlanEntiy, false);
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

	deleteServicePlanEntity(planRateId: number): void {
		this.loading = true;

		this.planRatesService.delete(this.currentPlanEntiy, planRateId)
			.subscribe(() => {
				this.notifier.notify('success', 'Se elimino la tirifa de servicio con exito');
				this.getPlanRates(this.currentPlanEntiy, false);
			}, err => {
				if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
			});
	}

	editServicePlanEntity(id: number): void {
		let planRate = this.planRates.find(plan => plan.PlanRateId === id);

		this.currentPlanRate = planRate.PlanRateId;

		Object.keys(this.planRate).forEach(key => {
			this.planRate[key] = planRate[key] ? parseInt(planRate[key]) ? parseInt(planRate[key]) : planRate[key] : null;

			if (key === 'Validity') {
				this.planRate.Validity = moment(planRate.Validity)
			}
		});
	}

	clearForm(): void {
		if (this.currentPlanEntiy) {
			this.clearAddPlanrate();
		} else {
			Object.keys(this.validator).forEach(key => {
				this.validator[key].reset();
			});
		}

		this.myNgForm.resetForm();
  }

  /**
   * select filter functions
   */
  public selectFilterData(value: string): void {
    if (!this.services) {
      return;
    }
    // get the search keyword
    if (!value) {
      this.selectFilteredData.next(this.services.slice());
      return;
    } else {
      value = value.toLowerCase();
    }
    // filter the services
    this.selectFilteredData.next(
      this.services.filter(service => service.Name.toLowerCase().indexOf(value) > -1)
    );
  }

  public resetSelectList(): void {
    this.selectFilteredData.next(this.services.slice());
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
