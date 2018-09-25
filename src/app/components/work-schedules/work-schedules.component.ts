import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { NotifierService } from 'angular-notifier';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { WorkSchedulesService } from '../../services/work-schedules.service';
import { WorkSchedule } from '../../models/work-schedules';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

@Component({
  selector: 'app-work-schedules',
  templateUrl: './work-schedules.component.html',
  styleUrls: ['./work-schedules.component.css']
})
export class WorkSchedulesComponent implements OnInit {
  public mainSpinner: boolean = false;
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource([]);
  public formActive: boolean = false;
  public permissions: any = {
    create: false,
    update: false
  };
  public workSchedules: WorkSchedule[];
  public currentWorkSchedule: number;
  public currentWorkScheduleName: string;
  public schedules: WorkSchedule[];
  private _onDestroy = new Subject<void>();

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService,
    private workSchedulesService: WorkSchedulesService
  ) { }

  ngOnInit() {
    this.permissions.create = this.auth.hasActionResource('Create');
    this.permissions.update = this.auth.hasActionResource('Update');
    this.mainSpinner = true;
    this.getData();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 0' : '';
  }

  private getData(): void {
    this.workSchedulesService.getWorkSchedulesRanges()
      .pipe(takeUntil(this._onDestroy))
      .subscribe(data => {
        let workSchedulesMap = [];
        let scheduleList = [];

        this.workSchedules = data;

        workSchedulesMap = data.map((row: WorkSchedule) => {
          return {
            WorkScheduleId: +row.WorkScheduleId,
            name: row.work_schedule.Name,
            range: moment('2018-1-1 ' + row.Start).format('hh:mm A') + ' - ' + moment('2018-1-1 ' + row.End).format('hh:mm A')
          }
        });

        //agrupar rangos por WorkScheduleId
        for (let schedule of workSchedulesMap) {
          let currentSchedule = scheduleList.find(item => item.WorkScheduleId === schedule.WorkScheduleId);

          if (currentSchedule) {
            if (Array.isArray(currentSchedule.range)) {
              currentSchedule.range.push(schedule.range)
            } else {
              currentSchedule.range = [currentSchedule.range];
              currentSchedule.range.push(schedule.range);
            }
          } else {
            schedule.range = [schedule.range];
            scheduleList.push(schedule);
          }
        }

        this.dataSource.data = scheduleList;

        this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
        this.mainSpinner = false;
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.mainSpinner = false;
      });
  }

	/**
   * showForm
   */
  public showForm(id?: number): void {
    this.currentWorkSchedule = id;
    this.schedules = this.workSchedules.filter(item => (+item.WorkScheduleId) === id);
    this.schedules.forEach(item => {
      item.Start = item.Start.substr(0,5);
      item.End = item.End.substr(0,5);
      item.Id = +item.Id;
      item.WorkScheduleId = +item.WorkScheduleId;
    });
    this.currentWorkScheduleName = this.schedules[0].work_schedule.Name;
    this.formActive = true;
  }

	/**
	 * hideForm
	 */
  public hideForm(): void {
    this.mainSpinner = true;
    this.formActive = false;
    this.schedules = null;
    this.currentWorkSchedule = null;
    this.getData();
  }

	/**
	 * formInvalid
	 */
  public formInvalid(): boolean {
    // let invalid = false;

    return false;
  }

  public denyKeybardEntry(): boolean {
    return false;
  }

  public addRow(): void {
    this.schedules.push({
      Id: null,
      WorkScheduleId: this.currentWorkSchedule,
      End: '00:00',
      Start: '00:00'
    });
  }

  public delete(ScheduleId: number, idx: number): void {
    if (!ScheduleId) {
      let schedulesCopy = this.schedules.slice();

      schedulesCopy.splice(idx, 1);
      this.schedules = schedulesCopy;

      return;
    }

    this.mainSpinner = true;

    this.workSchedulesService.delete(ScheduleId)
      .pipe(takeUntil(this._onDestroy))
      .subscribe(data => {
        this.mainSpinner = false;
        this.schedules = this.schedules.filter(item => item.Id !== ScheduleId);
        this.notifier.notify('success', 'Se eliminó el horario con éxito');
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.mainSpinner = false;
      });
  }

	/**
	 * create and update.
	 */
  public submitForm(): void {
    let request = [];

    this.schedules.forEach(schedule => {
      let body = {
        WorkScheduleId: schedule.WorkScheduleId,
        End: schedule.End + ':00',
        Start: schedule.Start + ':00'
      };

      if (schedule.Id) {
        request.push(this.workSchedulesService.createOrUpdate(body, schedule.Id));
      } else {
        request.push(this.workSchedulesService.createOrUpdate(body));
      }
    });

    this.mainSpinner = true;

    Observable.forkJoin(request)
      .pipe(takeUntil(this._onDestroy))
      .subscribe(res => {
        this.notifier.notify('success', 'Se aplicaron los cambios con éxito');
        this.hideForm();
      }, err => {
        this.mainSpinner = false;

        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
      });
  }

}
