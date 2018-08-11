import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NotifierService } from 'angular-notifier';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
      private router: Router,
      private notifier: NotifierService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        let currentUser = JSON.parse(window.localStorage.getItem('current_user'));
        let resourceRoute = route.routeConfig.path;

        if (currentUser) {
            let isAuthorized = false;

            for (let module of currentUser.permissions) {
                isAuthorized = module.resources.some(resource => resource.route === ('/' + resourceRoute));

                if (isAuthorized) {
                    return true;
                }
            }

            this.notifier.notify('error','No puede acceder a esta ruta, por favor ingrese nuevamente');
        } else {
          this.notifier.notify('error','Su sesión ha expirado, por favor ingrese nuevamente');
        }

        this.router.navigate(['/login']);

        return false;
    }
}
