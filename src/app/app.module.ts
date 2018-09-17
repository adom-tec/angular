import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { HttpModule, BaseRequestOptions } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import lcoaleESCO from '@angular/common/locales/es-CO';
import { Routing } from './app.routing';
import { AngularMaterialModule } from './angular-material.module';
import { NotifierModule } from 'angular-notifier';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChartsModule } from 'ng2-charts';
import { AmazingTimePickerModule } from 'amazing-time-picker';

//components
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { UserComponent } from './components/security/users/user.component';
import { RoleComponent } from './components/security/roles/role.component';
import { UserRoleComponent } from './components/security/user-roles/user-role.component';
import { ChangePasswordComponent } from './components/security/change-password/changePassword.component';
import { RoleActionResourceComponent } from './components/security/role-resources/role.action.resource.component';
import { PatientComponent } from './components/patients/patients.components';
import { EntityComponent } from './components/entity/entity.component';
import { PlansRatesDialog } from './components/entity/plans-rates/plans-rates.component';
import { CoordinatorsComponent } from './components/coordinators/coordinators.component';
import { ProfessionalComponent } from './components/professionals/professionals.component';
import { AssignServiceComponent } from './components/assign-service/assign-service.component';
import { AssignServiceDialogComponent } from './components/assign-service/assign-service-dialog/assign-service-dialog.component';
import { PatientDialogComponent } from './components/assign-service/patient-dialog/patient-dialog.component';
import { ObservationsDialogComponent } from './components/assign-service/observations-dialog/observations-dialog.component';
import { ServiceSupplyDialogComponent } from './components/assign-service/service-supply-dialog/service-supply-dialog.component';
import { SupplyComponent } from './components/supply/supply.component';
import { ServiceComponent } from './components/service/service.component';
import { LockServiceComponent } from './components/lock-service/lock-service.component';
import { CopaymentFrecuencyComponent } from './components/copayment-frecuency/copayment-frecuency.component';
import { ServiceFrecuencyComponent } from './components/service-frecuency/service-frecuency.component';
import { NoticeComponent } from './components/notice/notice.component';
import { ProfessionalAssignedServicesComponent } from './components/professional-assigned-services/professional-assigned-services.component';
import { EditAssignedServiceDialogComponent } from './components/assign-service/edit-assigned-service-dialog/edit-assigned-service-dialog.component';
import { QuialityTestDialogComponent } from './components/assign-service/quiality-test-dialog/quiality-test-dialog.component';
import { CancelVisitsDialogComponent } from './components/assign-service/cancel-visits-dialog/cancel-visits-dialog.component';
import { CopaymentComponent } from './components/copayment/copayment.component';
import { CopaymentDialogComponent } from './components/copayment/copayment-dialog/copayment-dialog.component';
import { CopaymentReportComponent } from './components/reports/copayment-report/copayment-report.component';
import { GraphicReportComponent } from './components/graphic-report/graphic-report.component';
import { SpecialReportComponent } from './components/reports/special-report/special-report.component';
import { PaymentReportComponent } from './components/reports/payment-report/payment-report.component';
import { RipsComponent } from './components/rips/rips.component';
import { ProfessionalReportComponent } from './components/reports/professional-report/professional-report.component';
import { HoursWorkedNursingReportComponent } from './components/reports/hours-worked-nursing-report/hours-worked-nursing-report.component';

//services
import { AuthGuard } from './guards/auth.guard';
import { AuthenticationService, HttpService, RoleService, UserService, PatientService, EntityService, PlansEntityService, PlanRatesService, CoordinatorService, ProfessionalService, AssignServiceService, ObservationService, AssignServiceSupplyService, SupplyService, ServicesService, ProfessionalAssignedServicesService, AssignServiceDetailService } from './services/index';

registerLocaleData(lcoaleESCO)

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    Routing,
    ChartsModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    NotifierModule.withConfig({
      position: {
        horizontal: {
          position: 'right'
        },
        vertical: {
          position: 'top'
        }
      },
    }),
    NgxMatSelectSearchModule,
    AmazingTimePickerModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    UserComponent,
    RoleComponent,
    UserRoleComponent,
    ChangePasswordComponent,
    RoleActionResourceComponent,
    PatientComponent,
    EntityComponent,
    CoordinatorsComponent,
    ProfessionalComponent,
    AssignServiceComponent,
    SupplyComponent,
    ServiceComponent,
    LockServiceComponent,
    CopaymentFrecuencyComponent,
    ServiceFrecuencyComponent,
    NoticeComponent,
    ProfessionalAssignedServicesComponent,
    CopaymentComponent,
    GraphicReportComponent,
    SpecialReportComponent,
    PaymentReportComponent,
    CopaymentReportComponent,
    ProfessionalReportComponent,
    HoursWorkedNursingReportComponent,
    RipsComponent,
    //dialogs
    PlansRatesDialog,
    AssignServiceDialogComponent,
    PatientDialogComponent,
    ObservationsDialogComponent,
    ServiceSupplyDialogComponent,
    EditAssignedServiceDialogComponent,
    QuialityTestDialogComponent,
    CancelVisitsDialogComponent,
    CopaymentDialogComponent
],
  entryComponents: [
    PlansRatesDialog,
    AssignServiceDialogComponent,
    PatientDialogComponent,
    ObservationsDialogComponent,
    ServiceSupplyDialogComponent,
    EditAssignedServiceDialogComponent,
    QuialityTestDialogComponent,
    CancelVisitsDialogComponent,
    CopaymentDialogComponent
  ],
  providers: [
    HttpService,
    AuthGuard,
    AuthenticationService,
    UserService,
    RoleService,
    PatientService,
    EntityService,
    PlansEntityService,
    PlanRatesService,
    CoordinatorService,
    ProfessionalService,
    AssignServiceService,
    ServicesService,
    ObservationService,
    AssignServiceSupplyService,
    SupplyService,
    AssignServiceDetailService,
    ProfessionalAssignedServicesService,
    { provide: LOCALE_ID, useValue: "es-CO" }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
