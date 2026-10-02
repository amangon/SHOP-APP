import React, { useState, useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import {
  COLORS,
  SIZES,
  SPACING,
  RADIUS,
  FONT_FAMILY,
} from '../../constants/theme';

import {
  LoadingScreen,
  EmptyState,
} from '../../components';

import {
  useCategories,
  useProducts,
  useFavouriteProductIds,
} from '../../hooks';

import { useAuth } from '../../lib/auth-context';

import {
  addFavourite,
  removeFavourite,
} from '../../services/api';

import { useQueryClient } from '@tanstack/react-query';

import {
  Product,
  Category,
} from '../../types';


const SCREEN_WIDTH = Dimensions.get('window').width;

const CARD_WIDTH =
  (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;


export default function JewelleryScreen() {

  const router = useRouter();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams();

  const selectedCategoryId =
    typeof params.categoryId === 'string'
      ? params.categoryId
      : '';

  const [searchQuery, setSearchQuery] = useState('');

  const [metalFilter, setMetalFilter] =
    useState('');

  const [purityFilter, setPurityFilter] =
    useState('');

  const [featuredOnly, setFeaturedOnly] =
    useState(false);

  const [newOnly, setNewOnly] =
    useState(false);

  const [sortBy, setSortBy] =
    useState<'newest' | 'name'>('newest');

  const [demoFavouriteIds, setDemoFavouriteIds] =
    useState<string[]>([]);


  const {
    data: favouriteIds = [],
  } = useFavouriteProductIds();


  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();


  /*
  ============================================
  DEMO PRODUCTS
  ============================================
  */

  const demoProducts = useMemo(() => [

    {
      id: 'demo-1',
      name: 'Royal Gold Necklace',
      short_description:
        'Beautiful traditional necklace crafted in premium gold',
      full_description:
        'Beautiful traditional necklace crafted in premium 22K gold',
      category_id: 'necklaces',
      metal_type: 'Gold',
      purity: '22K',
      weight: '25g',
      image_url:
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600',
      is_featured: true,
      is_new_arrival: true,
      is_active: true,
      display_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 189000,
    },

    {
      id: 'demo-2',
      name: 'Traditional Gold Bangles',
      short_description:
        'Classic 22K gold bangles for weddings',
      full_description:
        'Classic traditional gold bangles with elegant design',
      category_id: 'bangles',
      metal_type: 'Gold',
      purity: '22K',
      weight: '50g',
      image_url:
        'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600',
      is_featured: true,
      is_new_arrival: false,
      is_active: true,
      display_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 168500,
    },

    {
      id: 'demo-3',
      name: 'Diamond Cut Earrings',
      short_description:
        'Elegant diamond cut earrings',
      full_description:
        'Elegant diamond cut 18K gold earrings',
      category_id: 'earrings',
      metal_type: 'Gold',
      purity: '18K',
      weight: '8g',
      image_url:
        'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600',
      is_featured: false,
      is_new_arrival: true,
      is_active: true,
      display_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 75000,
    },

    {
      id: 'demo-4',
      name: 'Bridal Jewellery Set',
      short_description:
        'Complete bridal jewellery collection',
      full_description:
        'Complete 22K bridal jewellery set for weddings',
      category_id: 'sets',
      metal_type: 'Gold',
      purity: '22K',
      weight: '120g',
      image_url:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600',
      is_featured: true,
      is_new_arrival: false,
      is_active: true,
      display_order: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 450000,
    },

    {
      id: 'demo-5',
      name: 'Classic Gold Ring',
      short_description:
        'Timeless gold ring for everyday wear',
      full_description:
        'Premium 22K classic gold ring',
      category_id: 'rings',
      metal_type: 'Gold',
      purity: '22K',
      weight: '5g',
      image_url:
        'https://images.unsplash.com/photo-1603561596112-db1d5e6cce47?w=600',
      is_featured: false,
      is_new_arrival: false,
      is_active: true,
      display_order: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 45000,
    },

    {
      id: 'demo-6',
      name: 'Temple Necklace',
      short_description:
        'Traditional temple style necklace',
      full_description:
        'Intricately designed premium temple necklace',
      category_id: 'necklaces',
      metal_type: 'Gold',
      purity: '22K',
      weight: '30g',
      image_url:
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600',
      is_featured: true,
      is_new_arrival: false,
      is_active: true,
      display_order: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 210000,
    },

    {
      id: 'demo-7',
      name: 'Designer Pendant',
      short_description:
        'Modern premium designer pendant',
      full_description:
        'Modern 18K gold designer pendant',
      category_id: 'pendants',
      metal_type: 'Gold',
      purity: '18K',
      weight: '10g',
      image_url:
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600',
      is_featured: false,
      is_new_arrival: true,
      is_active: true,
      display_order: 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 65000,
    },

    {
      id: 'demo-8',
      name: 'Classic Gold Chain',
      short_description:
        'Premium gold chain for daily wear',
      full_description:
        'Elegant 22K gold chain with premium finish',
      category_id: 'chains',
      metal_type: 'Gold',
      purity: '22K',
      weight: '30g',
      image_url:
        'https://images.unsplash.com/photo-1619119069152-a2b331eb392a?w=600',
      is_featured: false,
      is_new_arrival: false,
      is_active: true,
      display_order: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 190000,
    },

    {
      id: 'demo-9',
      name: 'Wedding Bangles',
      short_description:
        'Heavy wedding gold bangles',
      full_description:
        'Premium traditional wedding bangles',
      category_id: 'bangles',
      metal_type: 'Gold',
      purity: '22K',
      weight: '100g',
      image_url:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',
      is_featured: true,
      is_new_arrival: false,
      is_active: true,
      display_order: 9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 350000,
    },

    {
      id: 'demo-10',
      name: 'Premium Earrings',
      short_description:
        'Elegant premium gold earrings',
      full_description:
        'Premium handcrafted 22K gold earrings',
      category_id: 'earrings',
      metal_type: 'Gold',
      purity: '22K',
      weight: '12g',
      image_url:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600',
      is_featured: false,
      is_new_arrival: true,
      is_active: true,
      display_order: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 85000,
    },

  ] as Product[], []);



  /*
  ============================================
  DATA
  ============================================
  */

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useCategories();


  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();



  /*
  ============================================
  SELECT PRODUCT SOURCE
  ============================================
  */

  const sourceProducts = useMemo(() => {

    if (
      products &&
      products.length > 0 &&
      !productsError
    ) {
      return products;
    }

    return demoProducts;

  }, [
    products,
    productsError,
    demoProducts,
  ]);



  /*
  ============================================
  DEMO CATEGORIES
  ============================================
  */

  const demoCategories = [

    {
      id: 'necklaces',
      name: 'Necklaces',
    },

    {
      id: 'earrings',
      name: 'Earrings',
    },

    {
      id: 'rings',
      name: 'Rings',
    },

    {
      id: 'bangles',
      name: 'Bangles',
    },

    {
      id: 'sets',
      name: 'Sets',
    },

    {
      id: 'pendants',
      name: 'Pendants',
    },

    {
      id: 'chains',
      name: 'Chains',
    },

  ];



  const categoriesToDisplay =
    categories && categories.length > 0
      ? categories
      : demoCategories;



  /*
  ============================================
  FILTER PRODUCTS
  ============================================
  */

  const filteredProducts = useMemo(() => {

    let result = sourceProducts.filter((product) => {

      if (!product.is_active) {
        return false;
      }


      const matchesCategory =
        !selectedCategoryId ||
        product.category_id === selectedCategoryId;


      const matchesMetal =
        !metalFilter ||
        product.metal_type === metalFilter;


      const matchesPurity =
        !purityFilter ||
        product.purity === purityFilter;


      const matchesFeatured =
        !featuredOnly ||
        product.is_featured;


      const matchesNew =
        !newOnly ||
        product.is_new_arrival;


      const search =
        searchQuery.trim().toLowerCase();


      const matchesSearch =
        !search ||
        product.name
          ?.toLowerCase()
          .includes(search) ||

        product.short_description
          ?.toLowerCase()
          .includes(search) ||

        product.metal_type
          ?.toLowerCase()
          .includes(search) ||

        product.purity
          ?.toLowerCase()
          .includes(search);


      return (
        matchesCategory &&
        matchesMetal &&
        matchesPurity &&
        matchesFeatured &&
        matchesNew &&
        matchesSearch
      );

    });


    if (sortBy === 'name') {

      result = [...result].sort(
        (a, b) =>
          a.name.localeCompare(b.name)
      );

    } else {

      result = [...result].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

    }


    return result;

  }, [
    sourceProducts,
    selectedCategoryId,
    metalFilter,
    purityFilter,
    featuredOnly,
    newOnly,
    searchQuery,
    sortBy,
  ]);



  /*
  ============================================
  METALS
  ============================================
  */

  const metals = useMemo(() => {

    return [
      ...new Set(
        sourceProducts
          .map(
            product => product.metal_type
          )
          .filter(Boolean)
      ),
    ] as string[];

  }, [sourceProducts]);



  /*
  ============================================
  PURITIES
  ============================================
  */

  const purities = useMemo(() => {

    return [
      ...new Set(
        sourceProducts
          .map(
            product => product.purity
          )
          .filter(Boolean)
      ),
    ] as string[];

  }, [sourceProducts]);



  /*
  ============================================
  FAVOURITE
  ============================================
  */

  const toggleFavourite =
    async (product: Product) => {

      const isDemoProduct =
        product.id.startsWith('demo-');


      if (isDemoProduct) {

        setDemoFavouriteIds((previous) => {

          if (
            previous.includes(product.id)
          ) {

            return previous.filter(
              id => id !== product.id
            );

          }


          return [
            ...previous,
            product.id,
          ];

        });


        return;

      }


      if (
        authLoading ||
        !isAuthenticated
      ) {

        Alert.alert(
          'Sign in required',
          'Please sign in to save favourite jewellery.'
        );

        return;

      }


      try {

        if (
          favouriteIds.includes(product.id)
        ) {

          await removeFavourite(product.id);

        } else {

          await addFavourite(product.id);

        }


        await queryClient.invalidateQueries({
          queryKey: ['favourites'],
        });


      } catch (error: any) {

        console.error(
          'Jewellery favourite update failed:',
          error
        );

        Alert.alert(
          'Unable to update favourite',
          'Please try again.'
        );

      }

    };



  /*
  ============================================
  RESET FILTERS
  ============================================
  */

  const resetFilters = () => {

    setMetalFilter('');
    setPurityFilter('');
    setFeaturedOnly(false);
    setNewOnly(false);
    setSearchQuery('');

    router.setParams({
      categoryId: '',
    });

  };



  /*
  ============================================
  LOADING
  ============================================
  */

  if (
    categoriesLoading &&
    productsLoading
  ) {

    return (
      <LoadingScreen
        message="Loading jewellery..."
      />
    );

  }




  const insets = useSafeAreaInsets();

  const getCategoryFallbackImage = (name?: string) => {
    const value = String(name || '').toLowerCase();

    if (value.includes('neck')) {
      return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600';
    }
    if (value.includes('ear')) {
      return 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600';
    }
    if (value.includes('ring')) {
      return 'https://images.unsplash.com/photo-1603561596112-db1d5e6cce47?w=600';
    }
    if (value.includes('bangle')) {
      return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600';
    }
    if (value.includes('pendant')) {
      return 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600';
    }
    if (value.includes('chain')) {
      return 'https://images.unsplash.com/photo-1619119069152-a2b331eb392a?w=600';
    }
    return null;
  };

  /*
  ============================================
  PRODUCT CARD
  ============================================
  */
  const renderProductCard = ({ item }: { item: Product }) => {
    const isDemo = item.id.startsWith('demo-');
    const isFavourite = isDemo
      ? demoFavouriteIds.includes(item.id)
      : favouriteIds.includes(item.id);

    const metalAndPurity = [item.metal_type, item.purity]
      .filter(Boolean)
      .join(' · ');

    const handleFavourite = (event: any) => {
      event.stopPropagation();
      void toggleFavourite(item);
    };

    return (
      <TouchableOpacity
        activeOpacity={0.94}
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.imagePlaceholder]}>
              <MaterialCommunityIcons
                name="diamond-stone"
                size={48}
                color={COLORS.gold}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.heartButton}
            onPress={handleFavourite}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={23}
              color={isFavourite ? '#F0646F' : COLORS.white}
            />
          </TouchableOpacity>

          {item.is_best_seller ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Bestseller</Text>
            </View>
          ) : item.is_new_arrival ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>New</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>

          {metalAndPurity ? (
            <Text style={styles.productMetal} numberOfLines={1}>
              {metalAndPurity}
            </Text>
          ) : null}

          {item.short_description ? (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.short_description}
            </Text>
          ) : (
            <Text style={styles.productDescription} numberOfLines={2}>
              Crafted with timeless elegance and premium finish.
            </Text>
          )}

          <Text style={styles.productPrice}>
            ₹{Number(item.price || 0).toLocaleString('en-IN')}
          </Text>

          <View style={styles.cardBottom}>
            <View style={styles.ratingStub}>
              <MaterialCommunityIcons
                name="star"
                size={15}
                color={COLORS.gold}
              />
              <Text style={styles.ratingText}>View Details</Text>
            </View>

            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color={COLORS.gold}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /*
  ============================================
  HEADER
  ============================================
  */
  const ListHeader = () => (
    <>
      <View
        style={[
          styles.topHeader,
          { paddingTop: Math.max(insets.top, SPACING.sm) + 2 },
        ]}
      >
        <TouchableOpacity
          style={styles.topIconButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={27}
            color={COLORS.gold}
          />
        </TouchableOpacity>

        <Image
          source={require('../../assets/main-logo.png')}
          style={styles.topLogo}
          resizeMode="contain"
        />

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.topIconButton}
            onPress={() => router.push('/favourites')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="heart-outline"
              size={26}
              color={COLORS.gold}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterCircle}
            onPress={resetFilters}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={22}
              color={COLORS.gold}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.titleLine}>
          <Text style={styles.titleWhite}>Jewellery </Text>
          <Text style={styles.titleGold}>Collection</Text>
        </Text>
        <Text style={styles.pageSubtitle}>
          Discover timeless elegance crafted for every occasion
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={COLORS.secondaryText}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jewellery, rings, necklaces..."
          placeholderTextColor="#8E8E8E"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={COLORS.secondaryText}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/jewellery')}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionAction}>View All →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryTile,
            !selectedCategoryId && styles.categoryTileActive,
          ]}
          onPress={() =>
            router.setParams({
              categoryId: '',
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.categoryImageWrap}>
            <MaterialCommunityIcons
              name="view-grid-outline"
              size={30}
              color={
                !selectedCategoryId ? COLORS.primary : COLORS.gold
              }
            />
          </View>
          <Text
            style={[
              styles.categoryName,
              !selectedCategoryId && styles.categoryNameActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {categoriesToDisplay.map((category: Category) => {
          const active = selectedCategoryId === category.id;
          const image =
            category.image_url || getCategoryFallbackImage(category.name);

          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryTile}
              onPress={() =>
                router.setParams({
                  categoryId: category.id,
                })
              }
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.categoryImageWrap,
                  active && styles.categoryImageWrapActive,
                ]}
              >
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="diamond-stone"
                    size={30}
                    color={COLORS.gold}
                  />
                )}
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.filterHeader}>
        <Text style={styles.sectionTitle}>Filter Jewellery</Text>
        <TouchableOpacity
          onPress={resetFilters}
          activeOpacity={0.8}
        >
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        {metals.map((metal) => (
          <TouchableOpacity
            key={`metal-${metal}`}
            style={[
              styles.filterChip,
              metalFilter === metal && styles.filterChipActive,
            ]}
            onPress={() =>
              setMetalFilter(metalFilter === metal ? '' : metal)
            }
            activeOpacity={0.82}
          >
            <Text
              style={[
                styles.filterText,
                metalFilter === metal && styles.filterTextActive,
              ]}
            >
              {metal}
            </Text>
          </TouchableOpacity>
        ))}

        {purities.map((purity) => (
          <TouchableOpacity
            key={`purity-${purity}`}
            style={[
              styles.filterChip,
              purityFilter === purity && styles.filterChipActive,
            ]}
            onPress={() =>
              setPurityFilter(purityFilter === purity ? '' : purity)
            }
            activeOpacity={0.82}
          >
            <Text
              style={[
                styles.filterText,
                purityFilter === purity && styles.filterTextActive,
              ]}
            >
              {purity}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.filterChip,
            featuredOnly && styles.filterChipActive,
          ]}
          onPress={() => setFeaturedOnly((value) => !value)}
          activeOpacity={0.82}
        >
          <Text
            style={[
              styles.filterText,
              featuredOnly && styles.filterTextActive,
            ]}
          >
            Featured
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            newOnly && styles.filterChipActive,
          ]}
          onPress={() => setNewOnly((value) => !value)}
          activeOpacity={0.82}
        >
          <Text
            style={[
              styles.filterText,
              newOnly && styles.filterTextActive,
            ]}
          >
            New
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterChip}
          onPress={() =>
            setSortBy(sortBy === 'newest' ? 'name' : 'newest')
          }
          activeOpacity={0.82}
        >
          <Text style={styles.filterText}>
            {sortBy === 'newest' ? 'Featured' : 'A-Z'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color={COLORS.secondaryText}
          />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.productHeader}>
        <View style={styles.productHeaderLeft}>
          <Text style={styles.productSectionTitle}>Jewellery</Text>
          <Text style={styles.productCount}>({filteredProducts.length} Items)</Text>
        </View>

        <TouchableOpacity
          style={styles.sortPill}
          onPress={() =>
            setSortBy(sortBy === 'newest' ? 'name' : 'newest')
          }
          activeOpacity={0.82}
        >
          <Text style={styles.sortLabel}>Sort by</Text>
          <Text style={styles.sortValue}>
            {sortBy === 'newest' ? 'Featured' : 'A-Z'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={18}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="magnify-close"
              size={52}
              color={COLORS.gold}
            />
            <Text style={styles.emptyTitle}>No jewellery found</Text>
            <Text style={styles.emptyText}>
              Try changing your filters or search.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={resetFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        }
        columnWrapperStyle={
          filteredProducts.length > 0
            ? styles.productRow
            : undefined
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

/*
============================================
STYLES
============================================
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },

  listContent: {
    paddingBottom: 150,
  },

  topHeader: {
    minHeight: 74,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090909',
  },

  topIconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topLogo: {
    width: 170,
    height: 58,
  },

  topRightActions: {
    width: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },

  filterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#211F19',
    borderWidth: 1,
    borderColor: '#3B3423',
  },

  titleBlock: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 5,
    paddingBottom: 15,
  },

  titleLine: {
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 31,
    lineHeight: 37,
  },

  titleWhite: {
    color: COLORS.white,
  },

  titleGold: {
    color: COLORS.lightGold,
  },

  pageSubtitle: {
    marginTop: 5,
    color: '#B7B7B7',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 14,
  },

  searchContainer: {
    marginHorizontal: SPACING.lg,
    height: 55,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#373737',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 14,
  },

  sectionRow: {
    marginTop: 24,
    paddingHorizontal: SPACING.lg,
    marginBottom: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 18,
  },

  sectionAction: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 14,
  },

  categoriesContent: {
    paddingHorizontal: SPACING.lg,
    gap: 12,
    paddingBottom: 2,
  },

  categoryTile: {
    width: 112,
    alignItems: 'center',
  },

  categoryImageWrap: {
    width: 96,
    height: 96,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#6B531B',
    overflow: 'hidden',
  },

  categoryImageWrapActive: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },

  categoryImage: {
    width: '100%',
    height: '100%',
  },

  categoryName: {
    marginTop: 8,
    color: '#E0E0E0',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
    textAlign: 'center',
  },

  categoryNameActive: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },

  filterHeader: {
    marginTop: 23,
    paddingHorizontal: SPACING.lg,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  clearText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 14,
  },

  filterContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 18,
    gap: 9,
  },

  filterChip: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  filterChipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },

  filterText: {
    color: '#E1E1E1',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },

  filterTextActive: {
    color: '#101010',
  },

  productHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 2,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  productHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    flexShrink: 1,
  },

  productSectionTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 21,
  },

  productCount: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 15,
  },

  sortPill: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '55%',
  },

  sortLabel: {
    color: '#AFAFAF',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 12,
  },

  sortValue: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 12,
  },

  productRow: {
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#151515',
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#474747',
  },

  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.98,
    position: 'relative',
    backgroundColor: '#121212',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  heartButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30,30,30,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: COLORS.gold,
  },

  statusBadgeText: {
    color: '#131313',
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 10,
  },

  productInfo: {
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 12,
  },

  productName: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 16,
  },

  productMetal: {
    marginTop: 4,
    color: '#CECECE',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 12,
  },

  productDescription: {
    marginTop: 6,
    minHeight: 34,
    color: '#B3B3B3',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 11,
    lineHeight: 16,
  },

  productPrice: {
    marginTop: 7,
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 20,
  },

  cardBottom: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2F2F2F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ratingStub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  ratingText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 11,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 55,
  },

  emptyTitle: {
    marginTop: 14,
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 19,
  },

  emptyText: {
    marginTop: 7,
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
    backgroundColor: COLORS.gold,
  },

  emptyButtonText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 13,
  },
});
