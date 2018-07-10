import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpService } from './http-interceptor.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { Professional } from '../models/professional';

@Injectable()
export class ProfessionalService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getProfessionals(): Observable<Professional[]> {
        return this.http.get(`${environment.apiUrl}/api/professionals`)
            .map(res => res.json());
    }

    getProfessionalById(id: string | number): Observable<Professional> {
        return this.http.get(`${environment.apiUrl}/api/professionals/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(professional: Professional, id?: string | number): Observable<Response> {
        let url = `${environment.apiUrl}/api/professionals`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(professional));
    }
}
