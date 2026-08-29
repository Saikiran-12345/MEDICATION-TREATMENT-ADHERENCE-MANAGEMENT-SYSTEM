import type { User } from '../types';
import { storageService } from './storageService';

const SESSION_KEY = 'mtams_user_session';

// Demo credentials
export const DEMO_USERS: Record<string, User & { passwordHash: string }> = {
  admin: {
    id: 'admin-1',
    username: 'admin',
    name: 'Admin Supervisor',
    role: 'ADMIN',
    email: 'admin@mtams.com',
    passwordHash: 'admin123' // Plaintext for demo/educational purposes
  },
  staff: {
    id: 'staff-1',
    username: 'staff',
    name: 'Dr. Sarah Jenkins',
    role: 'STAFF',
    email: 's.jenkins@mtams.com',
    assignedStaffId: 'staff-1',
    passwordHash: 'staff123'
  },
  patient: {
    id: 'patient-1',
    username: 'patient',
    name: 'John Doe',
    role: 'PATIENT',
    email: 'john.doe@example.com',
    patientId: 'patient-1',
    passwordHash: 'patient123'
  }
};

export const authService = {
  getCurrentUser(): User | null {
    return storageService.get<User | null>(SESSION_KEY, null);
  },

  login(username: string, passwordHash: string): User | null {
    const user = DEMO_USERS[username.toLowerCase()];
    if (user && user.passwordHash === passwordHash) {
      // Exclude passwordHash before saving to session
      const { passwordHash: _, ...userSession } = user;
      storageService.set(SESSION_KEY, userSession);
      return userSession;
    }
    return null;
  },

  logout(): void {
    storageService.remove(SESSION_KEY);
  }
};
