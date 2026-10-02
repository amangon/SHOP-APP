import { Category, Product } from '../types';

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const product = (id: string, name: string, price: number, purity: string, imageUrl: string, flags: Partial<Product> = {}): Product => ({
  id, name, category_id: null, short_description: 'Hand-finished jewellery crafted for lasting elegance.', full_description: 'A refined Swarna Abhushan design made with carefully selected materials and a premium finish.', metal_type: purity === '18K' ? 'Gold' : 'Gold', purity, weight: '8.5g', image_url: imageUrl, is_featured: true, is_new_arrival: true, is_active: true, display_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), price, original_price: price + 12000, making_charges: 4500, stock_quantity: 5, sku: `DEMO-${id}`, is_best_seller: true, ...flags,
});

export const DEMO_PRODUCTS: Product[] = [
  product('demo-necklace', 'Diamond Necklace', 189000, '18K', image('photo-1599643478518-a784e5dc4c8f')),
  product('demo-bridal', 'Gold Bridal Necklace', 168500, '22K', image('photo-1611652022419-a9419f74343d'), { is_new_arrival: false }),
  product('demo-jhumka', 'Traditional Gold Earrings', 62500, '22K', image('photo-1535632066927-ab7c9ab60908')),
  product('demo-diamond-earrings', 'Diamond Earrings', 48500, '18K', image('photo-1601121141461-9d6647bca1ed')),
  product('demo-ruby-ring', 'Ruby Gold Ring', 38500, '18K', image('photo-1605100804763-247f67b3557e')),
  product('demo-mangalsutra', 'Gold Mangalsutra', 73500, '22K', image('photo-1617038260897-41a1f14a8ca0')),
  product('demo-gold-bracelet', 'Gold Bracelet', 82500, '22K', image('photo-1611652022419-a9419f74343d')),
  product('demo-diamond-bracelet', 'Diamond Bracelet', 246000, '18K', image('photo-1573408301185-9146fe634ad0')),
  product('demo-pendant', 'Gold Pendant', 54500, '18K', image('photo-1602173574767-37ac01994b2a')),
  product('demo-bangles', 'Traditional Gold Bangles', 139500, '22K', image('photo-1617038220319-276d3cfab638')),
];

export const DEMO_CATEGORIES: Category[] = [
  'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles', 'Pendants', 'Chains', 'Mangalsutra', 'Gold Jewellery', 'Diamond Jewellery',
].map((name, index) => ({ id: `demo-category-${index}`, name, image_url: image(['photo-1605100804763-247f67b3557e', 'photo-1599643478518-a784e5dc4c8f', 'photo-1535632066927-ab7c9ab60908'][index % 3]), is_active: true, display_order: index, created_at: new Date().toISOString() }));
