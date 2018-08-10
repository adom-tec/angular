import { Injectable } from '@angular/core';
import { Http, XHRBackend, RequestOptions, Request, RequestOptionsArgs, Response, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import "rxjs/add/observable/fromPromise";
import "rxjs/add/operator/mergeMap";
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { NotifierService } from 'angular-notifier';

@Injectable()
export class HttpService extends Http {
    private origRequest: Request;
    private origOptions: RequestOptionsArgs;
    private currentUser: any;

    constructor (
        backend: XHRBackend,
        options: RequestOptions,
        private router: Router,
        private notifier: NotifierService
    ) {
        super(backend, options);
    }

    private getRequestOptionArgs(options?: RequestOptionsArgs) : RequestOptionsArgs {
        if (!options) {
            options = new RequestOptions();
        }

        if (!options.headers) {
            options.headers = new Headers();
        }

        options.headers.append('Content-Type', 'application/json');

        return options;
    }

    request(url: string|Request, options?: RequestOptionsArgs): Observable<Response> {
        this.currentUser = JSON.parse(window.localStorage.getItem('current_user'));

        if (typeof url === 'string') {
            if (!options) {
                options = { headers: new Headers() };
            }

            options.headers.set('Authorization', `Bearer ${this.currentUser.access_token}`);
        } else {
            url.headers.set('Authorization', `Bearer ${this.currentUser.access_token}`);
        }

        this.origRequest = url as Request;
        this.origOptions = options as RequestOptionsArgs;

        return super.request(url, options)
    }

    get(url: string, options?: RequestOptionsArgs, noIntercept?: boolean): Observable<Response> {
        if (noIntercept) {
            return super.get(url, options);
        }

        return this.intercept(super.get(url, options));
    }

    post(url: string, body: any, options?: RequestOptionsArgs, noIntercept?: boolean): Observable<Response> {
        if (noIntercept) {
            return super.post(url, body, options);
        }

        return this.intercept(super.post(url, body, this.getRequestOptionArgs(options)));
    }

    put(url: string, body: any, options?: RequestOptionsArgs, noIntercept?: boolean): Observable<Response> {
        if (noIntercept) {
            return super.put(url, body, options);
        }

        return this.intercept(super.put(url, body, this.getRequestOptionArgs(options)));
    }

    delete(url: string, options?: RequestOptionsArgs, noIntercept?: boolean): Observable<Response> {
        if (noIntercept) {
            return super.delete(url, options);
        }

        return this.intercept(super.delete(url, options));
    }

    protected intercept(observable: Observable<Response>): Observable<Response> {
        return observable.catch((err, source) => {
            if (err.status == 401) {
                if (err.json().message === "The refresh token is invalid.") {
                    this.router.navigate(['/login']);
                    this.notifier.notify('error','Su sesión ha expirado, por favor ingrese nuevamente');
                    return Observable.throw(new Error('No se pudo logear'));
                }

                let origRq = this.origRequest,
                    origOpt = this.origOptions;

                return this.refreshToken()
                    .mergeMap(res => {
                        if(res) {
                            let data = res.json();

                            if(data.access_token) {
                                this.currentUser.access_token = data['access_token'];
                                this.currentUser.refresh_token = data['refresh_token'];
                                window.localStorage.setItem('current_user', JSON.stringify(this.currentUser));

                                return this.request(origRq, origOpt);
                            } else {
                                return Observable.throw(new Error('No se pudo logear'));
                            }
                        }

                    });

            } else {
                return Observable.throw(err);
            }
        });
    }

    protected refreshToken(): Observable<Response> {
        let json = JSON.stringify({
            "grant_type": "refresh_token",
            "client_id": environment.client_id,
            "client_secret": environment.client_secret,
            "refresh_token": this.currentUser.refresh_token,
            "scope": ""
        });

        return this.post(`${environment.apiUrl}/oauth/token`, json, this.getRequestOptionArgs());
    }
}
