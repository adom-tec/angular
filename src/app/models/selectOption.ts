export class SelectOption {
  Id: number;
  Name: string;
  State?: boolean | number;

  constructor(data?: any) {
    if (data) {
      data.Id = data.id;
      data.Name = data.name;

      Object.assign(this, data);
    }
  }
}
