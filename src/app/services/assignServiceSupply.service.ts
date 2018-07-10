import { Coordinator } from './../models/coordinator';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpService } from './http-interceptor.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { AssignServiceSupply } from '../models/assignServiceSupply';

@Injectable()
export class AssignServiceSupplyService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getServiceSupplies(serviceId: number): Observable<AssignServiceSupply[]> {
        return this.http.get(`${environment.apiUrl}/api/services/${serviceId}/supplies`)
            .map(res => res.json());
    }

    getServiceSupplyById(serviceId: number, id: number): Observable<AssignServiceSupply> {
        return this.http.get(`${environment.apiUrl}/api/services/${serviceId}/supplies/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(serviceId: number, supply: AssignServiceSupply, id?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/services/${serviceId}/supplies`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(supply));
    }

    delete(serviceId: number, id: number): Observable<AssignServiceSupply> {
        return this.http.delete(`${environment.apiUrl}/api/services/${serviceId}/supplies/${id}`)
            .map(res => res.json());
    }

    public mapToTableFormat(data: AssignServiceSupply[]): any[] {
        return data.map((supply: AssignServiceSupply) => {
            return {
                assignServiceSupplyId: supply.AssignServiceSupplyId,
                supplyName: supply.supply.Name,
                quantity: supply.Quantity,
                billetTo: supply.billed_to.Name
            };
        });
    }
}
