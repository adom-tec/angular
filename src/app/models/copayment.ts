export class Copayment {
    AssignServiceId: number;
    PatientDocument: string;
    PatientName: string;
    EntityName: string;
    AuthorizationNumber: number;
    ServiceName: string;
    PaymentProfessional: number;
    Quantity: number;
    CoPaymentAmount: number;
    CoPaymentFrecuency: string;
    TotalCopaymentReceived: number;
    Pin: string;
    PatientDocumentType: string;
    KITMNB: number;
    SubTotal: number;
    Total: number;
    OtherValuesReceived: number;   
    isSelected?: boolean; 
    professional_rate_id?: number; 
}