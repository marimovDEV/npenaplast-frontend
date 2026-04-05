import api from './api';
import { User } from '../types';

export const authService = {
  async login(username: string, password: string): Promise<{ user: User }> {
    // Clear existing tokens first to prevent interceptor from sending invalid ones
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    const response = await api.post('token/', { username, password });
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Now fetch user details (assuming there's a /api/users/me/ or similar profile endpoint)
    // For now, we'll return a mock user based on the role we know or wait for profile endpoint implementation
    // Ideally, the token response or a separate call gives us the user object
    // For this ERP, let's assume we can fetch the user profile
    const profileResponse = await api.get('users/me/'); 
    const userData = profileResponse.data;
    
    // Helper to parse assignedWarehouses safely
    const parseWarehouses = (data: any): string[] => {
      let assigned = data.assigned_warehouses || data.assignedWarehouses || [];
      if (typeof assigned === 'string') {
        return assigned === '*' ? ['*'] : assigned.split(',').map((s: string) => s.trim());
      }
      if (Array.isArray(assigned)) {
        return assigned.map(String);
      }
      return [];
    };

    // Map backend roles (UPPER_SNAKE) to frontend roles (PascalCase)
    const roleMapping: Record<string, string> = {
      'SUPERADMIN': 'Bosh Admin',
      'ADMIN': 'Admin',
      'WAREHOUSE_OPERATOR': 'Omborchi',
      'PRODUCTION_OPERATOR': 'Ishlab chiqarish ustasi',
      'CNC_OPERATOR': 'CNC operatori',
      'FINISHING_OPERATOR': 'Pardozlovchi',
      'WASTE_OPERATOR': 'Chiqindi operatori',
      'SALES_MANAGER': 'Sotuv menejeri'
    };

    const normalizedRole = userData.effective_role || userData.role_display || roleMapping[userData.role] || userData.role;
    let assigned = parseWarehouses(userData);

    const isPrivileged = (['Bosh Admin', 'SuperAdmin', 'Admin', 'SUPERADMIN', 'ADMIN'].includes(normalizedRole) || userData.is_superuser);
    if (isPrivileged) {
      assigned = ['*'];
    }

    return { 
      user: {
        ...userData,
        role: normalizedRole,
        effective_role: normalizedRole,
        name: userData.name || userData.full_name || userData.username,
        assignedWarehouses: assigned
      } 
    };
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getTokens() {
    return {
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token'),
    };
  }
};
