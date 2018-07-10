import { Service } from './../models/service';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpService } from './http-interceptor.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';

@Injectable()
export class ServicesService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getServices(): Observable<Service[]> {
        return this.http.get(`${environment.apiUrl}/api/services`)
            .map(res => res.json());
    }

    getServiceById(id: number): Observable<Service> {
        return this.http.get(`${environment.apiUrl}/api/services/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(coord: Service, id?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/services`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(coord));
    }

    public mapToTableFormat(data: Service[]): any[] {
        return data.map((service: Service) => {
            return {
                serviceId: service.ServiceId,
                name: service.Name,
                code: service.Code,
                serviceType: service.service_type.Name,
                classification: service.classification.Name,
                value: service.Value,
            };
        });
    }
}
