import { Response } from '@angular/http';
import { HttpService } from './http-interceptor.service';
import { Injectable } from '@angular/core';
import { Patient } from '../models/index';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class PatientService {

    constructor(
        private http: HttpService,
        private authenticationService: AuthenticationService
    ) {}  

    getPatients(): Observable<Patient[]> {
        return this.http.get(`${environment.apiUrl}/api/patients`)
            .map(res => res.json());
    }

    getPatientById(id: string | number): Observable<Patient> {
        return this.http.get(`${environment.apiUrl}/api/patients/${id}`)
            .map(res => res.json());
    }

    createOrUpdate(patient: Patient, id?: string | number): Observable<Response> {
        let url = `${environment.apiUrl}/api/patients`;
        
        url = id ? url + '/' + id : url;

        return this.http[id ? 'put' : 'post'](url, JSON.stringify(patient));
    }

    public mapPatientToTableFormat(data: Patient[]): any[] {
        return data.map(patient => {
            return {
                patientId: patient.PatientId,
                typeDoc: patient.document_type.Name.toLowerCase(),
                numDoc: patient.Document.toLowerCase(),
                names: `${patient.FirstName} ${patient.SecondName || ''}`.trim().toLowerCase(),
                lastnames: `${patient.Surname} ${patient.SecondSurname || ''}`.trim().toLowerCase(),
                telephone: patient.Telephone1,
                typePatient: patient.patient_type.Name.toLowerCase()
            };
        });
    }
}