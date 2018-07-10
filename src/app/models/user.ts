export class User {
    UserId?: number;
    Email: string;
    FirstName: string;
    SecondName: string;
    Surname: string;
    SecondSurname: string;
    State: string|boolean;
    Password?: string;
    PasswordConfirm?: string;
    fullname?: string;
}