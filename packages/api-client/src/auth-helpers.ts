export interface AuthUser {
  id?: string;
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  state_code?: string;
}

export interface PortalOption {
  label: string;
  desc: string;
  path: string;
  badge?: string;
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('crystal_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
}

export function getDesignatedRoute(role?: string): string {
  switch (role) {
    case 'super_admin':
    case 'agency_admin':
      return '/admin';
    case 'care_coordinator':
    case 'registered_nurse':
      return '/clients';
    case 'caregiver':
      return '/caregiver/portal';
    case 'client':
    case 'family':
      return '/portal/client';
    default:
      return '/caregiver/portal';
  }
}

export function getAllowedPortals(role?: string): PortalOption[] {
  const allPortals: (PortalOption & { roles: string[] })[] = [
    {
      label: 'Caregiver Portal',
      desc: 'Shifts, credential vault & in-service training',
      path: '/caregiver/portal',
      roles: ['super_admin', 'agency_admin', 'caregiver', 'registered_nurse'],
    },
    {
      label: 'Client & Family Portal',
      desc: 'Care plans, schedules, authorizations & visits',
      path: '/portal/client',
      roles: ['super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse', 'caregiver', 'client', 'family'],
    },
    {
      label: 'Client Operations',
      desc: 'Clinical intake, assessments & authorizations',
      path: '/clients',
      roles: ['super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse'],
    },
    {
      label: 'Admin Command Center',
      desc: 'Multi-state analytics, audits & survey exports',
      path: '/admin',
      roles: ['super_admin', 'agency_admin'],
    },
  ];

  if (!role) return [];
  return allPortals.filter((p) => p.roles.includes(role));
}
