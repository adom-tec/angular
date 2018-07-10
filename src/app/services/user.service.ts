import { Response } from '@angular/http';
import { HttpService } from './http-interceptor.service';
import { Injectable } from '@angular/core';
import { User, Password } from '../models/index';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class UserService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) {}  

    getUsers(filter: string = ''): Observable<User[]> {
        return this.http.get(`${environment.apiUrl}/api/users${filter ? `/${filter}` : filter}`)
            .map(res => res.json());
    }

    getUserById(id: number): Observable<User> {
        return this.http.get(`${environment.apiUrl}/api/users/${id}`)
            .map(res => res.json())
    }

    createOrUpdate(user: User, id?: number): Observable<Response> {
        let url = `${environment.apiUrl}/api/users`;

        url = id ? url + '/' + id : url;
        user.State = user.State ? '1' : '0';

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(user));
    }
}