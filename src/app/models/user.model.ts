export interface User {
  _id?: string;
  name: string;
  email: string;
  mobile: string; // ✅ Added
  role: 'USER' | 'OWNER';
  token?: string;
  createdAt?: string | Date; // ✅ Added
  lastLogin?: string | Date; // ✅ Added
}
