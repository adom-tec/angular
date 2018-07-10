export class PlanRate {
    PlanRateId?: number;
    PlanEntityId?: number; 
    ServiceId: number;
    Rate: number;
    Validity: string|object;
    service?: any;
}