import { Supply } from './../models/supply';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpService } from './http-interceptor.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';

@Injectable()
export class SupplyService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getSupplies(): Observable<Supply[]> {
        return this.http.get(`${environment.apiUrl}/api/supplies`)
            .map(res => res.json());
    }

    getSupplyById(id: number): Observable<Supply> {
        return this.http.get(`${environment.apiUrl}/api/supplies/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(supply: Supply, id?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/supplies`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(supply));
    }

    delete(id: number): Observable<Response> {
        return this.http.delete(`${environment.apiUrl}/api/supplies/${id}`);
    }
}
