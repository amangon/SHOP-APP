import { supabase } from '../lib/supabase';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

export const uploadImage = async (
  bucket: string,
  imageUri: string,
  pathPrefix: string = ''
): Promise<UploadResult> => {
  try {
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const fileExt = filename.split('.').pop() || 'jpg';
    const uniqueName = `${pathPrefix}${pathPrefix ? '/' : ''}${Date.now()}.${fileExt}`;

    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to read image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueName, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { url: null, error: error?.message || 'Upload failed' };
  }
};

export const deleteImage = async (bucket: string, path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

export const getPublicUrl = (bucket: string, path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
};

export const storage = {
  uploadImage,
  deleteImage,
  getPublicUrl,
};

export const uploadProductImage = (imageUri: string): Promise<UploadResult> =>
  uploadImage('product-images', imageUri, 'products');

export const uploadBannerImage = (imageUri: string): Promise<UploadResult> =>
  uploadImage('banner-images', imageUri, 'banners');

export const uploadBrandAsset = (imageUri: string): Promise<UploadResult> =>
  uploadImage('brand-assets', imageUri, 'brand');

export const uploadCategoryImage = (imageUri: string): Promise<UploadResult> =>
  uploadImage('category-images', imageUri, 'categories');

export const uploadLoginLogo = (imageUri: string): Promise<UploadResult> =>
  uploadImage('brand-assets', imageUri, 'login');
