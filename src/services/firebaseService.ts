/**
 * Firebase Authentication Service (SIMULATED)
 * 
 * This service simulates Firebase Authentication functionality.
 * In a real implementation, this would connect to Firebase Auth SDK.
 * 
 * Features:
 * - User registration
 * - User login
 * - User logout
 * - Role management (admin/user)
 */

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'business' | 'user';
  createdAt: string;
}

// Simulated user database stored in localStorage
const USERS_KEY = 'firebase_users';
const CURRENT_USER_KEY = 'firebase_current_user';

// Initialize with dummy users
const initializeUsers = (): void => {
  const existingUsers = localStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    const dummyUsers: User[] = [
      {
        uid: 'admin_001',
        email: 'admin@invoicechain.com',
        displayName: 'System Admin',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        uid: 'user_123',
        email: 'user@test.com',
        displayName: 'John Business',
        role: 'business',
        createdAt: '2024-01-15T00:00:00Z',
      },
      {
        uid: 'user_456',
        email: 'demo@example.com',
        displayName: 'Demo User',
        role: 'user',
        createdAt: '2024-02-01T00:00:00Z',
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(dummyUsers));
  }
};

// Get all users from storage
export const getUsers = (): User[] => {
  initializeUsers();
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Save users to storage
const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Simulate user registration
 * @param email - User email
 * @param password - User password (not stored in simulation)
 * @param displayName - User display name
 * @param role - User role ('business' or 'user'), defaults to 'business'
 * @returns Promise with the created user
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: User['role'] = 'business'
): Promise<{ user: User | null; error: string | null }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const users = getUsers();
  
  // Check if user already exists
  if (users.find((u) => u.email === email)) {
    return { user: null, error: 'Email already registered' };
  }

  // Create new user
  const newUser: User = {
    uid: `user_${Date.now()}`,
    email,
    displayName,
    role, // Use provided role (defaults to 'business')
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

  return { user: newUser, error: null };
};

/**
 * Simulate user login
 * @param email - User email
 * @param password - User password (accepts any in simulation)
 * @returns Promise with the logged in user
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const users = getUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return { user: null, error: 'User not found' };
  }

  // In simulation, accept any password
  // In real Firebase, this would validate against stored credentials
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  return { user, error: null };
};

/**
 * Simulate user logout
 */
export const logoutUser = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  localStorage.removeItem(CURRENT_USER_KEY);
};

/**
 * Get current logged in user
 * @returns Current user or null
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user has specific role
 * @param role - Role to check
 * @returns Boolean indicating if user has role
 */
export const hasRole = (role: User['role']): boolean => {
  const user = getCurrentUser();
  return user?.role === role;
};

/**
 * Check if user is admin
 * @returns Boolean indicating if user is admin
 */
export const isAdmin = (): boolean => hasRole('admin');

/**
 * Login as admin (demo functionality)
 * @returns Promise with admin user
 */
export const loginAsAdmin = async (): Promise<{ user: User | null; error: string | null }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const users = getUsers();
  const adminUser = users.find((u) => u.role === 'admin');
  
  if (adminUser) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
    return { user: adminUser, error: null };
  }
  
  return { user: null, error: 'Admin user not found' };
};

/**
 * Update user role (admin only)
 * @param userId - User ID
 * @param newRole - New role
 * @returns Promise with success status
 */
export const updateUserRole = async (
  userId: string,
  newRole: User['role']
): Promise<{ success: boolean; error: string | null }> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const users = getUsers();
  const index = users.findIndex((u) => u.uid === userId);
  
  if (index === -1) {
    return { success: false, error: 'User not found' };
  }
  
  users[index].role = newRole;
  saveUsers(users);
  
  return { success: true, error: null };
};

/**
 * Delete user (admin only)
 * @param userId - User ID
 * @returns Promise with success status
 */
export const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error: string | null }> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const users = getUsers();
  const filteredUsers = users.filter((u) => u.uid !== userId);
  
  if (filteredUsers.length === users.length) {
    return { success: false, error: 'User not found' };
  }
  
  saveUsers(filteredUsers);
  return { success: true, error: null };
};

// Initialize users on module load
initializeUsers();
