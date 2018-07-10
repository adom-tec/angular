import { Entity } from './../models/entity';
import { Injectable } from '@angular/core';
import { HttpService } from './http-interceptor.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { environment } from '../../environments/environment';

@Injectable()
export class EntityService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) { }

    getEntities(): Observable<Entity[]> {
        return this.http.get(`${environment.apiUrl}/api/entities`)
            .map(res => res.json());
    }

    getEntityById(id: string | number): Observable<Entity> {
        return this.http.get(`${environment.apiUrl}/api/entities/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(entity: Entity, id?: string | number): Observable<Response> {
        let url = `${environment.apiUrl}/api/entities`;

        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(entity));
    }
}
