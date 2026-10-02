import { supabase } from '../lib/supabase';
import { Product, Category, GoldRate, GoldRateHistory, HomeBanner, AppSetting, Profile, Testimonial, ProductImage, RateHistoryPoint, Favourite, Notification } from '../types';

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchFeaturedProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(8);

  if (error) throw error;
  return data || [];
};

export const fetchNewArrivals = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_new_arrival', true)
    .order('display_order', { ascending: true })
    .limit(6);

  if (error) throw error;
  return data || [];
};

export const fetchBestSellers = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_best_seller', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) throw error;
  return data || [];
};

export const fetchProductById = async (
  id: string
): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
};

export const fetchProductImages = async (
  productId: string
): Promise<ProductImage[]> => {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const fetchFavouriteProductIds = async (): Promise<string[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) return [];

  const { data, error } = await supabase
    .from('favourites')
    .select('product_id')
    .eq('user_id', user.id);

  if (error) throw error;

  return (data || []).map((row) => row.product_id);
};

export const addFavourite = async (
  productId: string
): Promise<Favourite> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    throw new Error('Please sign in to save favourites.');
  }

  const { data, error } = await supabase
    .from('favourites')
    .upsert(
      {
        user_id: user.id,
        product_id: productId,
      },
      {
        onConflict: 'user_id,product_id',
      }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const removeFavourite = async (
  productId: string
): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    throw new Error('Please sign in to manage favourites.');
  }

  const { error } = await supabase
    .from('favourites')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);

  if (error) throw error;
};

export const fetchFavouriteProducts = async (): Promise<Product[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) return [];

  const { data: favourites, error: favouritesError } = await supabase
    .from('favourites')
    .select('product_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (favouritesError) throw favouritesError;

  const productIds = (favourites || []).map(
    (row) => row.product_id
  );

  if (productIds.length === 0) return [];

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('is_active', true);

  if (productsError) throw productsError;

  const productById = new Map(
    (products || []).map((product) => [
      product.id,
      product as Product,
    ])
  );

  return productIds
    .map((productId) => productById.get(productId))
    .filter(Boolean) as Product[];
};

/**
 * Fetch notifications visible to the currently signed-in user.
 *
 * Supports:
 * 1. Global notifications (user_id IS NULL)
 * 2. User-specific notifications (user_id = current user's id)
 */
export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'Notification session error:',
        sessionError
      );
      throw sessionError;
    }

    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('notifications')
      .select(
        'id, user_id, title, message, target_route, read_at, created_at'
      )
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(
        'Fetch notifications error:',
        error
      );
      throw error;
    }

    return data ?? [];
  } catch (error) {
    console.error(
      'fetchNotifications failed:',
      error
    );
    throw error;
  }
};

/**
 * Mark a user-specific notification as read.
 *
 * Global notifications (user_id IS NULL) are intentionally not
 * updated because the same notification is shared by all users.
 */
export const markNotificationRead = async (
  id: string
): Promise<void> => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'Notification read session error:',
        sessionError
      );
      throw sessionError;
    }

    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error(
        'Mark notification read error:',
        error
      );
      throw error;
    }
  } catch (error) {
    console.error(
      'markNotificationRead failed:',
      error
    );
    throw error;
  }
};

export const fetchProductsByCategory = async (
  categoryId: string
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return data || [];
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return data || [];
};

export const fetchGoldRates = async (): Promise<GoldRate[]> => {
  const { data, error } = await supabase
    .from('gold_rates')
    .select('*')
    .eq('is_current', true)
    .order('effective_date', { ascending: false })
    .order('metal_name', { ascending: true });

  if (error) throw error;

  const rates = Array.from(
    new Map(
      (data || []).map((rate) => [
        `${rate.metal_name}|${rate.purity}`,
        rate,
      ])
    ).values()
  ) as GoldRate[];

  return Promise.all(
    rates.map(async (rate) => {
      const {
        data: history,
        error: historyError,
      } = await supabase
        .from('gold_rates')
        .select('price')
        .eq('purity', rate.purity)
        .eq('metal_name', rate.metal_name)
        .eq('is_current', false)
        .order('effective_date', {
          ascending: false,
        })
        .limit(1);

      if (historyError || !history?.[0]) {
        return rate;
      }

      const previousPrice = Number(history[0].price);
      const priceDifference = rate.price - previousPrice;

      const priceDifferencePercent =
        previousPrice === 0
          ? 0
          : (priceDifference / previousPrice) * 100;

      return {
        ...rate,
        previous_price: previousPrice,
        price_difference: priceDifference,
        price_difference_percent:
          priceDifferencePercent,
      };
    })
  );
};

export const fetchGoldRateHistory = async (
  rateId: string
): Promise<GoldRateHistory[]> => {
  const { data, error } = await supabase
    .from('gold_rate_history')
    .select('*')
    .eq('rate_id', rateId)
    .order('recorded_at', {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
};

export const fetchGoldRateHistoryWindow = async (
  purity: string,
  days: number,
  metalName?: string
): Promise<RateHistoryPoint[]> => {
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('gold_rates')
    .select('price, effective_date')
    .eq('purity', purity)
    .eq('metal_name', metalName || 'Gold')
    .gte('effective_date', since)
    .order('effective_date', {
      ascending: true,
    });

  if (error) throw error;

  return (data || []).map((point) => ({
    price: Number(point.price),
    recorded_at: point.effective_date,
  }));
};

export const insertGoldRateHistory = async (
  history: Omit<GoldRateHistory, 'id'>
): Promise<GoldRateHistory> => {
  const { data, error } = await supabase
    .from('gold_rate_history')
    .insert([history])
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const fetchAllGoldRateHistory =
  async (): Promise<GoldRateHistory[]> => {
    const { data, error } = await supabase
      .from('gold_rate_history')
      .select('*')
      .order('recorded_at', {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  };

export const fetchActiveBanners = async (): Promise<HomeBanner[]> => {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order', {
      ascending: true,
    })
    .limit(3);

  if (error) throw error;

  return data || [];
};

export const fetchAppSetting = async (
  key: string
): Promise<AppSetting | null> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('setting_key', key)
    .maybeSingle();

  if (error) return null;

  return data;
};

export const fetchAppSettings =
  async (): Promise<AppSetting[]> => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('setting_key', {
        ascending: true,
      });

    if (error) throw error;

    return data || [];
  };

export const fetchLoginLogo = async (): Promise<string | null> => {
  const setting = await fetchAppSetting(
    'login_logo_url'
  );

  return setting?.setting_value || null;
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('display_order', {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
};

export interface ProfileImageAsset {
  uri: string;
  name: string;
  type: string;
}

export const uploadProfileImage = async (
  asset: ProfileImageAsset
): Promise<string> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw (
      userError ||
      new Error(
        'You must be signed in to upload a profile photo.'
      )
    );
  }

  const response = await fetch(asset.uri);

  if (!response.ok) {
    throw new Error(
      'Unable to read the selected image.'
    );
  }

  const body = await response.arrayBuffer();

  const extension =
    asset.name.split('.').pop()?.toLowerCase() ||
    'jpg';

  const path = `avatars/${user.id}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from('profile-photos')
    .upload(path, body, {
      contentType:
        asset.type || `image/${extension}`,
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(path);

  return `${publicUrl}?t=${Date.now()}`;
};

export const deleteProfilePhoto = async (
  photoUrl: string
): Promise<boolean> => {
  try {
    const marker = '/profile-photos/';
    const markerIndex = photoUrl.indexOf(marker);

    if (markerIndex === -1) return true;

    const filePath = decodeURIComponent(
      photoUrl
        .slice(markerIndex + marker.length)
        .split('?')[0]
    );

    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(
      'Error deleting profile photo:',
      error
    );

    return false;
  }
};

export const fetchCategoryById = async (
  categoryId: string
): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .maybeSingle();

  if (error) return null;

  return data;
};

export const fetchUserProfile =
  async (): Promise<Profile | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) return data;

    return {
      id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        null,
      email: user.email || '',
      frames_name:
        user.user_metadata?.frames_name || null,
      role:
        user.app_metadata?.role || 'user',
      created_at:
        user.created_at ||
        new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile;
  };

export const createNotification = async (
  notification: Omit<
    Notification,
    'id' | 'created_at'
  >
): Promise<Notification> => {
  const notificationWithTimestamps = {
    ...notification,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert([notificationWithTimestamps])
    .select()
    .single();

  if (error) throw error;

  return data;
};