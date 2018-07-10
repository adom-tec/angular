import { PlanEntity } from './../models/planEntity';
import { Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { HttpService } from './http-interceptor.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class PlansEntityService {
    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getPlansByEntity(entity: number): Observable<PlanEntity[]> {
        return this.http.get(`${environment.apiUrl}/api/entities/${entity}/plans`)
            .map(res => res.json());
    }

    getPlanByEntity(entity: number, plan: number): Observable<PlanEntity> {
        return this.http.get(`${environment.apiUrl}/api/entities/${entity}/plans/${plan}`)
            .map(res => res.json());
    }

    createOrUpdate(planEntity: PlanEntity, planEntityId?: number|string): Observable<Response> {
        let url = `${environment.apiUrl}/api/entities/${planEntity.EntityId}/plans`;

        url = planEntityId ? url + '/' + planEntityId : url;

        return this.http[planEntityId ? 'put' : 'post'](url, JSON.stringify(planEntity));
    }
}