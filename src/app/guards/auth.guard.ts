import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {
    
    constructor(private router: Router) { }

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
        }

        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});

        return false;
    }
}