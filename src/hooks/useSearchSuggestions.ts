import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SearchSuggestion {
  id: string;
  order_id?: string;
  shopify_order_number?: string;
  bill_to_name?: string;
  customer_email?: string;
  type: 'order_id' | 'customer_name' | 'customer_email';
}

export function useSearchSuggestions(query: string, enabled: boolean = true) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: cachedSuggestions } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      setIsLoading(true);
      try {
        // Simplified search - just search customers for now to avoid schema issues
        const { data: customers, error } = await supabase
          .from('customers')
          .select('id, email, name')
          .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
          .limit(8);

        if (error) {
          console.error('Error fetching search suggestions:', error);
          return [];
        }

        const suggestions: SearchSuggestion[] = [];

        // Process customers results
        if (customers) {
          customers.forEach(customer => {
            if (customer.email) {
              suggestions.push({
                id: customer.id,
                customer_email: customer.email,
                type: 'customer_email'
              });
            }
            if (customer.name) {
              suggestions.push({
                id: customer.id,
                bill_to_name: customer.name,
                type: 'customer_name'
              });
            }
          });
        }

        return suggestions;
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  useEffect(() => {
    if (cachedSuggestions) {
      setSuggestions(cachedSuggestions);
    }
  }, [cachedSuggestions]);

  return {
    suggestions,
    isLoading,
    clearSuggestions: () => setSuggestions([])
  };
}
