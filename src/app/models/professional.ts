import { SelectOption } from './selectOption';
import { User } from './user';

export class Professional {
    ProfessionalId?: number;
    UserId?: number;
    DocumentTypeId: number;
    Document: string;
    FirstName: string;
    SecondName: string;
    Surname: string;
    SecondSurname: string;
    BirthDate: string|object;
    DateAdmission: string|object;
    ContractTypeId: number;
    GenderId: number;
    SpecialtyId: number;
    Address: string;
    Neighborhood: string;
    Telephone1: number;
    Telephone2: number;
    Email: string;
    Availability: string;
    Coverage: string;
    FamilyName: string;
    FamilyRelationship: string;
    FamilyPhone: string;
    CodeBank: string;
    AccountTypeId: number;
    AccountNumber: number;
    State: boolean|string;
    //relations
    document_type?: SelectOption;
    gender?: SelectOption;
    user?: User;
}
