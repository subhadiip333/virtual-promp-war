import { describe, it, expect, vi } from 'vitest';
import { authService } from '../services/authService';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithPopup: vi.fn().mockResolvedValue({ user: { email: 'test@test.com' } }),
  GoogleAuthProvider: vi.fn(),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { email: 'test@test.com' } }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { email: 'test@test.com' } }),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ email: 'test@test.com' });
    return () => {};
  }),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

describe('authService', () => {
  it('should have mock loginWithEmail', async () => {
    const result = await authService.loginWithEmail('test@test.com', 'password');
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@test.com');
  });

  it('should have mock registerWithEmail', async () => {
    const result = await authService.registerWithEmail('test@test.com', 'password');
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@test.com');
  });

  it('should have mock loginWithGoogle', async () => {
    const result = await authService.loginWithGoogle();
    expect(result.user).toBeDefined();
  });

  it('should have mock logout', async () => {
    await expect(authService.logout()).resolves.toBeUndefined();
  });

  it('should have onAuthStateChange', () => {
    authService.onAuthStateChange((user) => {
      expect(user?.email).toBe('test@test.com');
    });
  });
});
