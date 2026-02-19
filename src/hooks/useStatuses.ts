import { useQuery } from '@tanstack/react-query'
import { StatusService } from '@/services/statuses'

/**
 * Hook to fetch and cache all statuses from the database
 * Uses React Query for caching and automatic refetching
 */
export function useStatuses() {
  return useQuery({
    queryKey: ['statuses', 'all'],
    queryFn: async () => {
      const statuses = await StatusService.getAllStatuses()
      return statuses.map(s => s.value)
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - statuses don't change often
    gcTime: 1000 * 60 * 60, // 1 hour - keep in cache longer
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

