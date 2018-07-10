import { SelectOption } from './selectOption';
import { Supply } from './supply';
export class AssignServiceSupply {
    AssignServiceSupplyId?: number;
    AssignServiceId?: number;
    SupplyId: number;
    Quantity: number;
    BilledToId: number;
    //relation
    supply?: Supply
    billed_to?: SelectOption;
}