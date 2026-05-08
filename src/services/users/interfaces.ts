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
  modules?: string[] | null;
  created_at: string;
}
