﻿import { SelectOption } from "./selectOption";
import { ReplaySubject } from "rxjs";
import { Professional } from "./professional";

export class AssignServiceDetail {
    AssignServiceDetailId: number;
    AssignServiceId: number;
    ProfessionalId: number|string; 
    DateVisit: string|object; 
    Consecutive: number;
    StateId: number;
    PaymentType: number;
    ReceivedAmount: number;
    OtherAmount: number;
    Observation: string;
    Pin: number;
    Verified: string|boolean;
    VerifiedBy: number;
    isQualityTestDone: boolean;
    QualityCallDate: string|object;
    QualityCallUser: string;
    RecordDate: string|object;
    UpdateDate: string|object;
    VerificationDate: string|object;
    Professional: string;
    detail_cancel_reason: any;
    professional_rate_id: number;
    //key front-end
    isSelected?: boolean;
    cancelReasonId?: number;
    //professional filter
    selectFilter?: string;
    selectFilteredData?: ReplaySubject<Professional[]>;
    //relation
    state?: SelectOption;
}


