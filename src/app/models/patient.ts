export class Patient {
    PatientId?: number;
    Document: string;
    DocumentTypeId: number;
    FirstName: string;
    SecondName: string;
    Surname: string;
    SecondSurname: string;
    GenderId: number;
    Occupation: string;
    BirthDate: string|object;
    Age: number;   
    UnitTimeId: number;
    Address: string;
    Neighborhood: string;
    Telephone1: number;
    Telephone2: number;
    Email: string;
    AttendantName: string;
    AttendantRelationship: string;
    AttendantPhone: string;
    AttendantEmail: string;
    Profile: string;
    PatientTypeId: number;
    CreatedOn?: Date;
    NameCompleted?: string;
    //relations
    document_type?: any;
    gender?: any;
    patient_type?: any;
    unit_time?: any;
}