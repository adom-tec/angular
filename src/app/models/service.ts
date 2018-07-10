import { SelectOption } from "./selectOption";

export class Service {
    ServiceId?: number;
    Value: number;
    special_value: number;
    particular_value: number;
    holiday_value: number;
    Code: string;
    Name: string;
    ClassificationId: number;
    ServiceTypeId: number;
    HoursToInvest: number;
    //relations
    service_type?: any;
    classification?: SelectOption;
}