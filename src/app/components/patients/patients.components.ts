import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as moment from 'moment';
import { environment } from './../../../environments/environment';
import { HttpService } from './../../services/http-interceptor.service';
import { AuthenticationService } from '../../services/authentication.service';
import { PatientService } from '../../services';
import { DocumentTypes } from '../../models/documentTypes';
import { SelectOption } from '../../models/selectOption';
import { Patient } from '../../models/patient';
import { NotifierService } from 'angular-notifier';

@Component({
    selector: 'app-patients',
    templateUrl: 'patients.component.html',
    styleUrls: ['patients.component.css']
})
export class PatientComponent implements OnInit {
    public mainSpinner: boolean = false;
    public loading: boolean = false;
    public displayedColumns: string[] = [];
    public dataSource = new MatTableDataSource([]);
    public filter: string;
    public formActive: boolean = false;
    public permissions: any = {
        create: false,
        update: false
    };

    public patients: Patient[];
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

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        private http: HttpService,
        private auth: AuthenticationService,
        private patientService: PatientService,
        private notifier: NotifierService
    ) {}

    ngOnInit() {
        this.permissions.create = this.auth.hasActionResource('Create');
        this.permissions.update = this.auth.hasActionResource('Update');
        this.mainSpinner = true;

        Observable.forkJoin(
            this.patientService.getPatients(),
            this.http.get(`${environment.apiUrl}/api/documenttypes`),
            this.http.get(`${environment.apiUrl}/api/unittimes`),
            this.http.get(`${environment.apiUrl}/api/genders`),
            this.http.get(`${environment.apiUrl}/api/patienttypes`),
        ).subscribe(res => {
            this.mapPatientToTableFormat(res[0]);
            this.documentTypes = res[1].json();
            this.unitTimes = res[2].json();
            this.genders = res[3].json();
            this.patientTypes = res[4].json();
            this.mainSpinner = false;
        }, err => {
            this.mainSpinner = false;
            if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
        });
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    public applyFilter(filterValue: string): void {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }

    getErrorMessage(formcontrol): string {
        return formcontrol.hasError('required') ? 'El campo no puede estar vacio' :
            formcontrol.hasError('min') ? 'El valor no puede ser menor a 1' : '';
    }

    /**
     * mapPatientToTableFormat
     */
    public mapPatientToTableFormat(data: Patient[]): void {
        this.patients = data.map(patient => {
            patient.BirthDate = moment(patient.BirthDate);
            return patient;
        });

        this.dataSource.data = this.patientService.mapPatientToTableFormat(data);

        this.displayedColumns = this.dataSource.data.length ? Object.keys(this.dataSource.data[0]) : [];
    }

    /**
     * validateKey
     */
    public validateKey(e: any, typeDocumentId: number) {
        var validKeyCode = [8, 37, 39, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 9];

        if (![3, 5].includes(+typeDocumentId)) {
            if (!validKeyCode.includes(e.keyCode)) {
                e.stopPropagation();
                e.preventDefault();

                return false;
            }
        }
    }

    /**
     * showForm
     */
    public showForm(id?: number): void {
        this.formActive = true;
        this.filter = '';
        this.applyFilter('');
        // this.patient.GenderId = this.genders[0].Id;

        if (id) {
            let row = this.patients.find(patient => patient.PatientId === id);
            this.currentPatient = id;

            Object.keys(this.patient).forEach(key => {
                this.patient[key] = row[key] ? parseInt(row[key]) ? parseInt(row[key]) : row[key] : null;
            });
        }
    }

    /**
     * hideForm
     */
    public hideForm(): void {
        Object.keys(this.patient).forEach(key => {
            this.patient[key] = null;
        });

        this.loading = false;
        this.formActive = false;
        this.currentPatient = null;

        this.mainSpinner = true;
        this.patientService.getPatients()
            .subscribe(data => {
                this.mapPatientToTableFormat(data);
                this.mainSpinner = false;
            }, err => {
                this.mainSpinner = false;
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
            });
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
                this.notifier.notify('success', this.currentPatient ? 'Se aplicaron los cambios con exito' : 'Se creo el paciente con exito');
                this.hideForm();
            }, err => {
                if (err.status === 401) { return; }  this.notifier.notify('error', err.status >= 500 ? 'Ha ocurrido un error, por favor comuníquese con el administrador se sistema' : err.json().message ? err.json().message : 'No se pudo obtener la información, por favor recargue la página e intente nuevamente');
            });
    }
}
