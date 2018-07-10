import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpService } from './http-interceptor.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { Observation } from '../models/observation';

@Injectable()
export class ObservationService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getObservations(serviceid: number): Observable<Observation[]> {
        return this.http.get(`${environment.apiUrl}/api/services/${serviceid}/observations`)
            .map(res => res.json());
    }

    getObservationsById(serviceid: number, id: number): Observable<Observation> {
        return this.http.get(`${environment.apiUrl}/api/services/${serviceid}/observations/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(serviceid: number, obvs: Observation, id?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/services/${serviceid}/observations`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(obvs));
    }

    delete(serviceid: number, id: number): Observable<Response> {
        return this.http.delete(`${environment.apiUrl}/api/services/${serviceid}/observations/${id}`);
    }
}
