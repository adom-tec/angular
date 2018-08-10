import { User } from './models/user';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { menuIcons } from '../environments/menu-icons';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    public isMobile: Boolean = false;
    public openMenu: Boolean = false;
    public showNotice: Boolean = false;
    public logoMiddle: number = 0;

    public showMenu: Boolean = false;
    public menuModules: any = [];
    public menuResources: any = [];
    public user: User;

    constructor(
        private router: Router
    ) {
        let ww = window.innerWidth;

        if (ww <= 900) {
          this.isMobile = true;
          this.logoMiddle = (ww/2) - 27.025;
        }

        router.events.subscribe((nav: any) => {
            let currentUser = JSON.parse(window.localStorage.getItem('current_user'));
            let me = JSON.parse(window.localStorage.getItem('me'));
            let url = nav.urlAfterRedirects ? nav.urlAfterRedirects : nav.url;

            if (['/login', '/'].includes(url)) {
                this.showMenu = false;
                this.menuResources = [];
                this.menuModules = [];
                this.user = null;
            } else if (currentUser && nav.url) {
                this.showMenu = true;
                this.menuModules = currentUser.permissions;
                this.user = me;
                this.user.fullname = `${this.user.FirstName} ${(this.user.SecondName || '')} ${this.user.Surname} ${(this.user.SecondSurname || '')}`;

                let moduleAjuste = this.menuModules.find(module => module.moduleId === 2);
                this.showNotice = moduleAjuste ? moduleAjuste.resources.find(resource => (+resource.resourceId) === 47) ? true : false : false;
            }
        });
    }

    public showResources(resources: any): void {
        if (resources) {
            if (resources === 'me') {
                this.menuResources = [
                    {
                        actions:["Update"],
                        resourceId:"35",
                        resourceName: "Cambiar contraseña",
                        route: "/changepassword"
                    },
                    {
                        actions: [],
                        resourceId: "logout",
                        resourceName: "Cerrar Sesión",
                        route: "/logout"
                    }
                ]


            } else if (resources.length) {
                this.menuResources = resources.filter(resource => resource.resourceId !== '35' && resource.visible);
            }

            this.menuResources.forEach(resource => {
                let menuIcon = menuIcons.find(icon => icon.resourceId === resource.resourceId);

                if (menuIcon) {
                    resource['icon'] = menuIcon.icon;
                }
            });
        }
    }

    public closeSidenav(): void {
        this.menuResources = [];
        this.openMenu = false;
    }
}
