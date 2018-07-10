import { Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Role } from '../models/index';
import { AuthenticationService } from './authentication.service';
import { HttpService } from './http-interceptor.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class RoleService {
    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getRoles(): Observable<Role[]> {
        return this.http.get(`${environment.apiUrl}/api/roles`)
            .map(res => res.json());
    }

    getRoleById(id: number): Observable<Role> {
        return this.http.get(`${environment.apiUrl}/api/roles/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(role: Role, id?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/roles`;

        role = Object.assign({}, role);
        url = id ? url + '/' + id : url;
        role.State = role.State ? '1' : '0';

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(role));
    }
}