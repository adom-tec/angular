import { Service } from './service';
export class PlanRate {
    PlanRateId?: number;
    PlanEntityId?: number;
    ServiceId: number;
    Rate: number;
    Validity: string|object;
    service?: Service;
}
