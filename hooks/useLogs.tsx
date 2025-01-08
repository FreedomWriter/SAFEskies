import { LogFilters, Log } from '@/lib/types/logs';
import { useLogFilters } from './useLogFilters';
import { useLogsQuery } from './useLogsQuery';

export function useLogs(fetchFn: (filters: LogFilters) => Promise<Log[]>) {
  const { filters, filterHandlers } = useLogFilters();

  const { logs, isLoading, error } = useLogsQuery(fetchFn, filters);

  return {
    logs,
    isLoading,
    error,
    filters,
    ...filterHandlers,
  };
}
