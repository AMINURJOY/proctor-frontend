import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { rolesApi } from '../services/api';

interface MenuPermission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

type PermissionsMap = Record<string, MenuPermission>;

export function usePermissions() {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState<PermissionsMap>({});

  useEffect(() => {
    if (!currentUser?.role) return;

    const fetchPermissions = async () => {
      try {
        const res = await rolesApi.getByName(currentUser.role);
        const role = res.data.data || res.data;
        if (role?.menuPermissions && Array.isArray(role.menuPermissions)) {
          const permMap: PermissionsMap = {};
          for (const mp of role.menuPermissions) {
            permMap[mp.menuKey] = {
              canCreate: mp.canCreate ?? false,
              canRead: mp.canRead ?? false,
              canUpdate: mp.canUpdate ?? false,
              canDelete: mp.canDelete ?? false,
            };
          }
          setPermissions(permMap);
        }
      } catch {
        // Keep empty permissions
      }
    };

    fetchPermissions();
  }, [currentUser?.role]);

  return permissions;
}
