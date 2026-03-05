export interface UserProfile {
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
  profilePicture?: string;
  signature?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfilePayload {
  name?: string;
  surname?: string;
  email?: string;
  phoneNumber?: string;
  idNumber?: string;
  signature?: string;
}
