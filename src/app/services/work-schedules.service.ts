import { Response } from '@angular/http';
import { HttpService } from './http-interceptor.service';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';
import { WorkSchedule } from '../models/work-schedules';

@Injectable()
export class WorkSchedulesService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) {}

    getWorkSchedulesRanges(): Observable<WorkSchedule[]> {
        return this.http.get(`${environment.apiUrl}/api/workscheduleranges`)
            .map(res => res.json());
    }

    getWorkSchedulesRangeById(id: number): Observable<WorkSchedule> {
        return this.http.get(`${environment.apiUrl}/api/workscheduleranges/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(workSchedule: WorkSchedule, id?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/workscheduleranges`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(workSchedule));
    }

    delete(id: number): Observable<Response> {
      return this.http.delete(`${environment.apiUrl}/api/workscheduleranges/${id}`);
  }
}
