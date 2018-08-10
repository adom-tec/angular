import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import { environment } from './../../../../environments/environment';
import { HttpService } from './../../../services/http-interceptor.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { PatientService } from '../../../services';
import { DocumentTypes } from '../../../models/documentTypes';
import { SelectOption } from '../../../models/selectOption';
import { Patient } from '../../../models/patient';
import { AssignServiceDialogComponent } from '../assign-service-dialog/assign-service-dialog.component';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-patient-dialog',
  templateUrl: './patient-dialog.component.html',
  styleUrls: ['./patient-dialog.component.css']
})
export class PatientDialogComponent implements OnInit {
  public loading: boolean = false;
  public documentTypes: DocumentTypes[];
  public genders: SelectOption[];
  public patientTypes: SelectOption[];
  public unitTimes: SelectOption[];
  public currentPatient: number;
  public patient: Patient = {
    Document: '',
    DocumentTypeId: null,
    FirstName: '',
    SecondName: '',
    Surname: '',
    SecondSurname: '',
    GenderId: null,
    Occupation: '',
    BirthDate: null,
    Age: null,
    UnitTimeId: null,
    Address: '',
    Neighborhood: '',
    Telephone1: null,
    Telephone2: null,
    Email: '',
    AttendantName: '',
    AttendantRelationship: '',
    AttendantPhone: '',
    AttendantEmail: '',
    Profile: '',
    PatientTypeId: null
  };

  //Validators
  public validator = {
    documentType: new FormControl('', [Validators.required]),
    document: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    lastname: new FormControl('', [Validators.required]),
    sex: new FormControl('', [Validators.required]),
    patientType: new FormControl('', [Validators.required]),
    age: new FormControl('', [Validators.required, Validators.min(1)]),
    unitTime: new FormControl('', [Validators.required]),
    addess: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required])
  };

  constructor(
    private http: HttpService,
    private auth: AuthenticationService,
    private notifier: NotifierService,
    private patientService: PatientService,
    public dialogRef: MatDialogRef<AssignServiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.currentPatient = this.data.patientId;
  }

  ngOnInit() {
    this.loading = true;

    Observable.forkJoin(
      this.patientService.getPatientById(this.currentPatient),
      this.http.get(`${environment.apiUrl}/api/documenttypes`),
      this.http.get(`${environment.apiUrl}/api/unittimes`),
      this.http.get(`${environment.apiUrl}/api/genders`),
      this.http.get(`${environment.apiUrl}/api/patienttypes`),
    ).subscribe(res => {
      Object.keys(this.patient).forEach(key => {
        this.patient[key] = res[0][key] ? parseInt(res[0][key]) ? parseInt(res[0][key]) : res[0][key] : null;

        if (key === 'BirthDate') {
          this.patient.BirthDate = moment(res[0].BirthDate);
        }
      });

      this.documentTypes = res[1].json();
      this.unitTimes = res[2].json();
      this.genders = res[3].json();
      this.patientTypes = res[4].json();
      this.loading = false;
    }, err => {
      if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
    });
  }

  onNoClick(result?: any): void {
    this.dialogRef.close(result);
  }

  getErrorMessage(formcontrol): string {
    return formcontrol.hasError('required') ? 'El campo no puede estar vacío' :
      formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' : '';
  }

  /**
   * formInvalid
   */
  public formInvalid(): boolean {
    let invalid = false;

    Object.keys(this.validator).forEach(key => {
      invalid = this.validator[key].invalid || invalid;
    });

    return invalid;
  }

  /**
   * create and update.
   */
  public submitForm(patient: Patient): void {
    this.loading = true;

    this.patientService.createOrUpdate(patient, this.currentPatient)
      .subscribe(res => {
        this.notifier.notify('success', 'Se aplicaron los cambios con éxito');
        this.onNoClick(res.json());
      }, err => {
        if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador de sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        this.loading = false;
      });
  }
}