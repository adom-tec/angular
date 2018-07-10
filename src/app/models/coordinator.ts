export class Coordinator {
    CoordinatorId?: number;
    UserId?: number;
    Document: string;
    DocumentTypeId: number;
    GenderId: number;
    BirthDate: string|object;
    Telephone1: number;
    Telephone2: number;
    Email: string;
    FirstName: string;
    SecondName: string;
    Surname: string;
    SecondSurname: string;
    State: string;
    //relations
    document_type?: any;
    gender?: any;
    user?: any;
}