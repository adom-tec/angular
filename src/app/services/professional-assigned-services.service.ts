import { Response } from '@angular/http';
import { HttpService } from './http-interceptor.service';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { AssignService } from '../models/index';
import { environment } from '../../environments/environment';
import * as moment from 'moment';

@Injectable()
export class ProfessionalAssignedServicesService {

    constructor(
        private http: HttpService,
        private auth: AuthenticationService
    ) { }

    getProfessionalAssignedServices(stateId: number = 1): Observable<AssignService[]> {
        return this.http.get(`${environment.apiUrl}/api/me/services?status=${stateId}`)
            .map(res => res.json());
    }

    update(service: AssignService, id: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/me/services/${id}`;

        return this.http.put(url, JSON.stringify(service));
    }

    public mapToTableInProcessFormat(data: AssignService[]): any[] {
        return data.map((asgService: AssignService) => {
            return {
                assignServiceId: asgService.AssignServiceId,
                patientName: asgService.patient.NameCompleted.toLowerCase(),
                document: asgService.patient.Document,
                serviceName: asgService.service.Name.toLowerCase(),
                initDate: moment(asgService.InitialDate).format('DD/MM/YYYY'),
                completed: `${asgService.countMadeVisits}/${asgService.Quantity}`,
            };
        });
    }

    public mapToTableHistoryFormat(data: AssignService[]): any[] {
        return data.map((asgService: AssignService) => {
            return {
                assignServiceId: asgService.AssignServiceId,
                patientName: asgService.patient.NameCompleted.toLowerCase(),
                document: asgService.patient.Document,
                serviceName: asgService.service.Name.toLowerCase(),
                finalDate: moment(asgService.FinalDate).format('DD/MM/YYYY'),
                copaymentReceived: asgService.copaymentReceived
            };
        });
    }
}