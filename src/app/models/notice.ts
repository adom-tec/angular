import { User } from './user';
export class Notice {
    NoticeId?: number;
    NoticeTitle: string;
    NoticeText: string;
    userId?: number;
    CreationUserName?: string;
    CreationDate?: Date;
    //relations
    user?:User;
}