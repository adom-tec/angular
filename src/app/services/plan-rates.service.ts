import { PlanRate } from './../models/planRate';
import { Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { HttpService } from './http-interceptor.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class PlanRatesService {
    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getPlanRates(planEntityId: number): Observable<PlanRate[]> {
        return this.http.get(`${environment.apiUrl}/api/plans/${planEntityId}/services`)
            .map(res => res.json());
    }

    getPlanRate(planEntityId: number, planRateId: number): Observable<PlanRate> {
        return this.http.get(`${environment.apiUrl}/api/plans/${planEntityId}/services/${planRateId}`)
            .map(res => res.json());
    }

    createOrUpdate(planRate: PlanRate, planEntityId: number, planRateId?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/plans/${planEntityId}/services`;

        url = planRateId ? url + '/' + planRateId : url;

        return this.http[planRateId ? 'put' : 'post'](url, JSON.stringify(planRate));
    }

    delete(planEntityId: number, planRateId?: number): Observable<Response> {
        return this.http.delete(`${environment.apiUrl}/api/plans/${planEntityId}/services/${planRateId}`);
    }
}