// hooks/use-feed-roles.ts
import { useState } from 'react';
import { UserRole } from '@/lib/types/permission';

export const useCheckFeedRoles = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFeedRole = async (
    targetDid: string,
    uri: string
  ): Promise<UserRole> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/permissions/role-check?${new URLSearchParams({
          targetDid,
          uri,
        })}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check role');
      }

      const data = await response.json();
      return data.role as UserRole;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to check role';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkFeedRole,
    isLoading,
    error,
  };
};
