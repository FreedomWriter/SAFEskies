'use client';

import { Logs } from '../logs';
import { User } from '@/lib/types/user';
import { useLogs } from '@/hooks/useLogs';

interface ModLogsProps {
  user: User | null;
}

export function ModLogs({ user }: ModLogsProps) {
  const { logs, isLoading, error, filters, updateFilter, clearFilters } =
    useLogs();

  if (!user) {
    return null;
  }

  return (
    <Logs
      logs={logs}
      isLoading={isLoading}
      error={error}
      filters={filters}
      updateFilter={updateFilter}
      clearFilters={clearFilters}
    />
  );
}
