import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProducts,
  fetchProductById,
  fetchFeaturedProducts,
  fetchNewArrivals,
  fetchBestSellers,
  fetchProductImages,
  fetchFavouriteProductIds,
  fetchFavouriteProducts,
  fetchNotifications,
  fetchProductsByCategory,
  fetchCategories,
  fetchActiveBanners,
  fetchLoginLogo,
  fetchUserProfile,
  fetchTestimonials,
  fetchCategoryById,
  fetchAppSettings,
} from '../services/api';
import { supabase } from '../lib/supabase';
import { Profile, Product, Category, Testimonial } from '../types';

export { fetchLoginLogo };

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => fetchProductById(id),
    enabled: !!id,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: fetchFeaturedProducts,
  });
};

export const useNewArrivals = () => {
  return useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: fetchNewArrivals,
  });
};

export const useBestSellers = () => {
  return useQuery({
    queryKey: ['products', 'best-sellers'],
    queryFn: fetchBestSellers,
  });
};

export const useProductImages = (productId: string) => {
  return useQuery({
    queryKey: ['products', productId, 'images'],
    queryFn: () => fetchProductImages(productId),
    enabled: !!productId,
  });
};

export const useFavouriteProductIds = () => {
  return useQuery({
    queryKey: ['favourites', 'ids'],
    queryFn: fetchFavouriteProductIds,
    retry: false,
  });
};

export const useFavouriteProducts = () => {
  return useQuery({
    queryKey: ['favourites', 'products'],
    queryFn: fetchFavouriteProducts,
    retry: false,
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    retry: false,
  });
};

export const useProductsByCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: () => fetchProductsByCategory(categoryId),
    enabled: !!categoryId,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};

export const useBanners = () => {
  return useQuery({
    queryKey: ['banners'],
    queryFn: fetchActiveBanners,
  });
};

export const useTestimonials = () => {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: fetchTestimonials,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export const useCategory = (categoryId?: string) => {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => fetchCategoryById(categoryId || ''),
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
};

export const useLoginLogo = () => {
  return useQuery({
    queryKey: ['login-logo'],
    queryFn: fetchLoginLogo,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export const useUserProfile = () => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 2,
  });
};

export const useAuthCheck = () => {
  return useQuery({
    queryKey: ['auth-check'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { user: null, profile: null };

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        // Profile not found — return auth user with fallback profile
        return {
          user: session.user,
          profile: {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || null,
            email: session.user.email || '',
            role: session.user.app_metadata?.role || 'user',
            created_at: session.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile,
        };
      }

      return { user: session.user, profile };
    },
    staleTime: 1000 * 60,
    retry: false,
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchAppSettings,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export { useLiveRates, getDisplayPrice, getWeightLabel } from './useLiveRates';
export { useLiveRateHistory } from './useLiveRateHistory';
export { useLiveRateRealtime } from './useLiveRateRealtime';
