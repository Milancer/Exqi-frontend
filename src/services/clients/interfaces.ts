export interface Client {
  id: number;
  name: string;
  industry: string;
  division: string;
  contactName: string;
  contactSurname: string;
  position: string;
  contactPhoneNumber: string;
  contactEmail: string;
  hrContactName: string;
  hrContactSurname: string;
  hrContactPhoneNumber: string;
  hrContactEmail: string;
  logo?: string;
  modules: string[];
  created_at: string;
}
