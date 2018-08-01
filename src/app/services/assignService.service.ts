import { Response } from '@angular/http';
import { HttpService } from './http-interceptor.service';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { AssignService } from '../models/index';
import { environment } from '../../environments/environment';
import * as moment from 'moment';

@Injectable()
export class AssignServiceService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getPatientAssignServices(patientId: number): Observable<AssignService[]> {
        return this.http.get(`${environment.apiUrl}/api/patients/${patientId}/services`)
            .map(res => res.json());
    }

    getPatientAssignServicesById(patientId: number, id: number): Observable<AssignService> {
        return this.http.get(`${environment.apiUrl}/api/patients/${patientId}/services/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(patientId: number, service: AssignService, id?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/patients/${patientId}/services`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(service));
    }

    calculateFinalDateAssignService(quantity: number, serviceFrecuencyId: number, initialDate: string) {
        let params = {
            Quantity: quantity,
            ServiceFrecuencyId: serviceFrecuencyId,
            InitialDate: initialDate
        };

        return this.http.get(`${environment.apiUrl}/api/finaldate`, { params: params }).map(res => res.json());
    }

    public mapToTableFormat(data: AssignService[]): any[] {
        return data.map((asgService: AssignService) => {
            return {
                assignServiceId: asgService.AssignServiceId,
                service: asgService.service.Name,
                quantity: asgService.Quantity,
                countMadeVisits: asgService.countMadeVisits,
                copaymentFrecuency: asgService.co_payment_frecuency.Name,
                initialDate: moment(asgService.InitialDate).format('DD/MM/YYYY'),
                state: asgService.state.Name.toUpperCase()
            };
        });
    }
}
