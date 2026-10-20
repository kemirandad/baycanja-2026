
export interface Participant {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  photoUrl: string;
  category?: 'A' | 'B';
  eventType: 'Canto' | 'Baile';
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Password is for login check only, won't be stored in client state
  role: 'ADMIN' | 'CANTO' | 'BAILE';
}
