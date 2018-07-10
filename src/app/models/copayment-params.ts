import { Moment } from 'moment';

export class CopaymentParams {
    professionalId: number;
    copaymentState: number;
    serviceState: number;
    initDate: Moment;
    finalDate: Moment;
}