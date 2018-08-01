import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { LoginComponent } from './components/login/login.component';
import { UserComponent } from './components/security/users/user.component';
import { RoleComponent } from './components/security/roles/role.component';
import { UserRoleComponent } from './components/security/user-roles/user-role.component';
import { ChangePasswordComponent } from './components/security/change-password/changePassword.component';
import { RoleActionResourceComponent } from './components/security/role-resources/role.action.resource.component';
import { PatientComponent } from './components/patients/patients.components';
import { EntityComponent } from './components/entity/entity.component';
import { CoordinatorsComponent } from './components/coordinators/coordinators.component';
import { ProfessionalComponent } from './components/professionals/professionals.component';
import { AssignServiceComponent } from './components/assign-service/assign-service.component';
import { SupplyComponent } from './components/supply/supply.component';
import { ServiceComponent } from './components/service/service.component';
import { LockServiceComponent } from './components/lock-service/lock-service.component';
import { CopaymentFrecuencyComponent } from './components/copayment-frecuency/copayment-frecuency.component';
import { ServiceFrecuencyComponent } from './components/service-frecuency/service-frecuency.component';
import { NoticeComponent } from './components/notice/notice.component';
import { ProfessionalAssignedServicesComponent } from './components/professional-assigned-services/professional-assigned-services.component';
import { CopaymentComponent } from './components/copayment/copayment.component';
import { GraphicReportComponent } from './components/graphic-report/graphic-report.component';
import { SpecialReportComponent } from './components/reports/special-report/special-report.component';
import { PaymentReportComponent } from './components/reports/payment-report/payment-report.component';
import { CopaymentReportComponent } from './components/reports/copayment-report/copayment-report.component';
import { RipsComponent } from './components/rips/rips.component';

const appRoutes: Routes = [
    { path: '', component: LoginComponent},
    { path: 'login', component: LoginComponent },
    { path: 'passwordreset/:uuid', component: ChangePasswordComponent },
    { path: 'user', component: UserComponent, canActivate: [AuthGuard] },
    { path: 'role', component: RoleComponent, canActivate: [AuthGuard] },
    { path: 'userrole', component: UserRoleComponent, canActivate: [AuthGuard] },
    { path: 'changepassword', component: ChangePasswordComponent, canActivate: [AuthGuard] },
    { path: 'roleactionresource', component: RoleActionResourceComponent, canActivate: [AuthGuard] },
    { path: 'patient', component: PatientComponent, canActivate: [AuthGuard] },
    { path: 'entity', component: EntityComponent, canActivate: [AuthGuard] },
    { path: 'coordinator', component: CoordinatorsComponent, canActivate: [AuthGuard] },
    { path: 'professional', component: ProfessionalComponent, canActivate: [AuthGuard] },
    { path: 'assignservice', component: AssignServiceComponent, canActivate: [AuthGuard] },
    { path: 'professionalassignedservices', component: ProfessionalAssignedServicesComponent, canActivate: [AuthGuard] },
    { path: 'copayment', component: CopaymentComponent, canActivate: [AuthGuard] },
    { path: 'supply', component: SupplyComponent, canActivate: [AuthGuard] },
    { path: 'service', component: ServiceComponent, canActivate: [AuthGuard] },
    { path: 'lockservices', component: LockServiceComponent, canActivate: [AuthGuard] },
    { path: 'notices', component: NoticeComponent, canActivate: [AuthGuard] },
    { path: 'servicefrecuency', component: ServiceFrecuencyComponent, canActivate: [AuthGuard] },
    { path: 'copaymentfrecuency', component: CopaymentFrecuencyComponent, canActivate: [AuthGuard] },
    { path: 'home', component: GraphicReportComponent, canActivate: [AuthGuard] },
    { path: 'reportspecial', component: SpecialReportComponent, canActivate: [AuthGuard] },
    { path: 'reportpayments', component: PaymentReportComponent, canActivate: [AuthGuard] },
    { path: 'copaymentreport', component: CopaymentReportComponent, canActivate: [AuthGuard] },
    { path: 'ripsentity', component: RipsComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '' }
];

export const Routing = RouterModule.forRoot(appRoutes);
