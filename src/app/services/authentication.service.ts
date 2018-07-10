import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { Http, RequestOptions, Headers } from '@angular/http';
import { environment } from './../../environments/environment';

@Injectable()
export class AuthenticationService {

    constructor(
        private http: Http,
        private router: Router
    ) {}

    login(username: string, password: string): Observable<any> {
        var headers = new Headers();

        headers.append('Content-Type', 'application/json');

        let body = JSON.stringify({
            "grant_type": "password",
            "client_id": environment.client_id,
            "client_secret": environment.client_secret,
            "username": username,
            "password": password,
            "scope": ""
        });

        let options = new RequestOptions({ headers: headers });

        return this.http.post(`${environment.apiUrl}/oauth/token`, body, options)
            .map(res => res.json());
    }

    logout(): void {
        window.localStorage.removeItem('current_user');
        this.router.navigate(["/login"]);
    }


    isLogged(err: any): void {
        let message = err.json().message;

        if(message === "The refresh token is invalid.") {
            this.logout();
        } else {
            let msg = err.status === 418 ? message : "Ups! ha ocurrido un error, por favor intentelo denuevo";
        }
    }

    hasActionResource(action: string, route?: string): boolean {
        let modules = JSON.parse(window.localStorage.getItem('current_user')).permissions;
        let actions;
        
        if (/\&|\?/g.test(this.router.url)) {
            route = '/' + this.router.url.match(/[A-Za-z]+(?=\?)/g)[0];
        }

        modules.forEach(module => {
            let resource = module.resources.find(resource => resource.route === (route ? route : this.router.url));

            if (resource) {
                actions = resource.actions;
                return;
            }
        });

        return actions.includes(action);
    }

    isAuthenticated(): boolean {
        return window.localStorage.getItem("current_user") != null;
    }
}