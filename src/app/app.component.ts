import { User } from './models/user';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Module } from './models/module';
import { Resource } from './models/resource';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    public showMenu: Boolean = false;
    public menuModules: any = [];
    public menuResources: any = [];
    public user: User;
    public menuIcons = [
        {
            resourceId: "1",
            icon: "person_pin"
        },
        {
            resourceId: "2",
            icon: "group"
        },
        {
            resourceId: "3",
            icon: "group_add"
        },
        {
            resourceId: "4",
            icon: "recent_actors"
        },
        {
            resourceId: "35",
            icon: "vpn_key"
        },
        {
            resourceId: "logout",
            icon: "exit_to_app"
        },
        {
            resourceId: "5",
            icon: "perm_identity"
        },
        {
            resourceId: "46",
            icon: "how_to_reg"
        },
        {
            resourceId: "7",
            icon: "school"
        },
        {
            resourceId: "9",
            icon: "supervisor_account"
        },
        {
            resourceId: "11",
            icon: "business"
        },
        {
            resourceId: "48",
            icon: "category"
        },
        {
            resourceId: "1052",
            icon: "lock"
        },
        {
            resourceId: "14",
            icon: "category"
        },
        {
            resourceId: "16",
            icon: "shopping_cart"
        },
        {
            resourceId: "47",
            icon: "cast"
        },
        {
            resourceId: "23",
            icon: "local_printshop"
        },
        {
            resourceId: "30",
            icon: "stars"
        },
        {
            resourceId: "1053",
            icon: "pie_chart"
        },
        {
            resourceId: "31",
            icon: "payment"
        },
        {
            resourceId: "51",
            icon: "account_balance"
        },
        {
            resourceId: "44",
            icon: "autorenew"
        },
        {
            resourceId: "50",
            icon: "payment"
        }
    ];

    constructor(
        private router: Router
    ) {
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
                        resourceName: "Cerrar Sesion",
                        route: "/logout"
                    }
                ]


            } else if (resources.length) {
                this.menuResources = resources.filter(resource => resource.resourceId !== '35' && resource.visible);
            }

            this.menuResources.forEach(resource => {
                let menuIcon = this.menuIcons.find(icon => icon.resourceId === resource.resourceId);

                if (menuIcon) {
                    resource['icon'] = menuIcon.icon;
                }
            });
        }
    }

    public closeSidenav(): void {
        this.menuResources = [];
    }

}
