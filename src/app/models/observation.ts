import { User } from './user';
export class Observation {
    public Description: string;
    public AssignServiceId?: number;
    public UserId?: number;
    public RecordDate?: string|object;
    public AssignServiceObservationId?: number;
    public user?: User;
}