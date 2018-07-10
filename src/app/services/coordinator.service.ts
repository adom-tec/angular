import { Coordinator } from './../models/coordinator';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpService } from './http-interceptor.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';

@Injectable()
export class CoordinatorService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getCoordinators(): Observable<Coordinator[]> {
        return this.http.get(`${environment.apiUrl}/api/coordinators`)
            .map(res => res.json());
    }

    getCoordinatorById(id: string | number): Observable<Coordinator> {
        return this.http.get(`${environment.apiUrl}/api/coordinators/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(coord: Coordinator, id?: string | number): Observable<Response> {
        let url = `${environment.apiUrl}/api/coordinators`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(coord));
    }
}
