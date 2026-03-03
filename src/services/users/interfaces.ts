export interface User {
  id: number;
  name: string;
  surname: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  role: string;
  status: string;
  clientId: number;
  client?: { id: number; name: string };
  created_at: string;
}
