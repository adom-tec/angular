import { Response } from '@angular/http';
import { HttpService } from './http-interceptor.service';
import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';
import { AssignServiceDetail } from '../models';

@Injectable()
export class AssignServiceDetailService {

  constructor(
    private http: HttpService,
    private authenticationService: AuthenticationService
  ) { }

  getAssignedServiceDetail(assignServiceId: number): Observable<AssignServiceDetail[]> {
    return this.http.get(`${environment.apiUrl}/api/services/${assignServiceId}/details`)
      .map(res => res.json());
  }

  getMyAssignedServiceDetail(assignServiceId: number): Observable<AssignServiceDetail[]> {
    return this.http.get(`${environment.apiUrl}/api/services/${assignServiceId}/details/me`)
      .map(res => res.json());
  }

  update(serviceDetails: AssignServiceDetail[], assignServiceId: number): Observable<Response> {
    serviceDetails = serviceDetails.map(visit => {
      visit = Object.assign({}, visit);

      if (visit.selectFilteredData) {
        delete visit.selectFilteredData;
      }
      if (visit.authorizationFC) {
        delete visit.authorizationFC;
      }

      return visit;
    });

    return this.http.put(`${environment.apiUrl}/api/services/${assignServiceId}/details`, JSON.stringify({ details: serviceDetails }));
  }

  updateDetail(serviceDetail: AssignServiceDetail, assignServiceId: number, assignServiceDetailId: number): Observable<Response> {
    serviceDetail = Object.assign({}, serviceDetail);
    delete serviceDetail.selectFilteredData;

    return this.http.put(`${environment.apiUrl}/api/services/${assignServiceId}/details/${assignServiceDetailId}`, JSON.stringify(serviceDetail));
  }
}
