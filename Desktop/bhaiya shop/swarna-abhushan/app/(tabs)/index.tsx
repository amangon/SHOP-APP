import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  COLORS,
  SIZES,
  SPACING,
  RADIUS,
  FONT_FAMILY,
} from '../../constants/theme';

import {
  SectionHeader,
  TestimonialCard,
  EmptyState,
  BusinessContactButtons,
} from '../../components';

import {
  useFeaturedProducts,
  useNewArrivals,
  useBestSellers,
  useLiveRates,
  useCategories,
  useBanners,
  useTestimonials,
  useFavouriteProductIds,
  useSettings,
  getDisplayPrice,
  getWeightLabel,
} from '../../hooks';

import { useAuth } from '../../lib/auth-context';

import {
  Product,
  HomeBanner,
  Category,
  Testimonial,
} from '../../types';

import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
} from '../../constants/demo-data';

import {
  addFavourite,
  removeFavourite,
} from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = Math.max(SPACING.lg, 18);
const FEATURED_CARD_WIDTH = Math.min(Math.max(SCREEN_WIDTH * 0.64, 215), 255);
const CATEGORY_CARD_WIDTH = Math.min(Math.max(SCREEN_WIDTH * 0.19, 78), 92);

const getCategoryIcon = (name?: string) => {
  const value = String(name || '').toLowerCase();
  if (value.includes('neck')) return 'diamond';
  if (value.includes('ear')) return 'radio';
  if (value.includes('ring')) return 'circle';
  if (value.includes('bangle')) return 'album';
  if (value.includes('pendant')) return 'favorite';
  if (value.includes('chain')) return 'link';
  return 'category';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 17) return 'Good Afternoon,';
  return 'Good Evening,';
};

const formatPrice = (value?: number | string | null) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '₹0';
  return `₹${numeric.toLocaleString('en-IN')}`;
};


export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = React.useState(false);

  const firstName =
    user?.first_name ||
    user?.full_name?.split(' ')[0] ||
    'Guest';

  const avatarUrl = user?.avatar_url || user?.photo_url || null;

  const { data: banners, error: bannersError } = useBanners();
  const { data: liveRateData } = useLiveRates(10);
  const { data: categories } = useCategories();
  const { data: featuredProducts } = useFeaturedProducts();
  const { data: newArrivals } = useNewArrivals();
  const { data: bestSellers } = useBestSellers();
  const { data: testimonials } = useTestimonials();
  const { data: settings } = useSettings();
  const { data: favouriteIds = [] } = useFavouriteProductIds();

  const logoWidth = Math.min(Math.max(width * 0.22, 56), 90);
  const logoHeight = logoWidth;

  const availableCategories =
    Array.isArray(categories) && categories.length > 0
      ? categories
      : DEMO_CATEGORIES;
  const availableFeatured =
    Array.isArray(featuredProducts) && featuredProducts.length > 0
      ? featuredProducts
      : DEMO_PRODUCTS.filter((product) => product.is_featured);
  const availableArrivals =
    Array.isArray(newArrivals) && newArrivals.length > 0
      ? newArrivals
      : DEMO_PRODUCTS.filter((product) => product.is_new_arrival);
  const availableBestSellers =
    Array.isArray(bestSellers) && bestSellers.length > 0
      ? bestSellers
      : DEMO_PRODUCTS.filter((product) => product.is_best_seller);

  const liveEntries = Array.isArray(liveRateData?.rates)
    ? liveRateData.rates
    : [];

  const homeLiveEntries = liveEntries.filter((entry: any) => {
    const metal = String(entry?.metal ?? '');
    return metal === 'gold24k' || metal === 'silver';
  });

  const getHomeWeight = (metal: string): number => {
    return metal === 'silver' ? 1000 : 10;
  };

  const isProductFavourite = (productId: string) => favouriteIds.includes(productId);

  const toggleFavourite = async (productId: string) => {
    try {
      const currentFavouriteIds =
        queryClient.getQueryData<string[]>(['favourites', 'ids']) || [];

      if (currentFavouriteIds.includes(productId)) {
        await removeFavourite(productId);
      } else {
        await addFavourite(productId);
      }

      await queryClient.invalidateQueries({ queryKey: ['favourites'] });
    } catch (error) {
      console.error('Home favourite update failed:', error);
    }
  };

  const getSettingValue = (key: string): boolean => {
    if (!Array.isArray(settings) || settings.length === 0) return true;

    const setting = settings.find((item) => item.setting_key === key);
    if (!setting) return true;

    const value = String(setting.setting_value).toLowerCase().trim();
    return ['true', '1', 'yes', 'on'].includes(value);
  };

  const getContentValue = (key: string, fallback: string): string => {
    if (!Array.isArray(settings) || settings.length === 0) return fallback;
    const setting = settings.find((item) => item.setting_key === key);
    return setting?.setting_value || fallback;
  };

  const showLiveRates = getSettingValue('visibility_live_rates');
  const showHero = getSettingValue('visibility_hero');
  const showCollections = getSettingValue('visibility_explore_collections');
  const showFeatured = getSettingValue('visibility_featured_jewellery');
  const showNewArrivals = getSettingValue('visibility_new_arrivals');
  const showTestimonials = getSettingValue('visibility_testimonials');
  const showAbout = getSettingValue('visibility_about');

  const activeBanner: HomeBanner | undefined =
    Array.isArray(banners) && banners.length > 0 ? banners[0] : undefined;

  const featuredVisible = useMemo(
    () => availableFeatured.slice(0, 8),
    [availableFeatured]
  );

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await queryClient.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  };

  if (bannersError && !activeBanner && homeLiveEntries.length === 0) {
    return (
      <EmptyState
        title="Unable to load content"
        message="Please pull down to refresh"
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: Math.max(insets.bottom + 140, 145) },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.gold}
        />
      }
    >
      {/* =========================
          HEADER
      ========================= */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.headerIconButton}
              activeOpacity={0.75}
              accessibilityLabel="Notifications"
            >
              <MaterialIcons
                name="notifications-none"
                size={28}
                color={COLORS.lightGold}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
              accessibilityLabel="Profile"
            >
              <View style={styles.avatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <Image
            source={require('../../assets/main-logo.png')}
            style={[
              styles.logo,
              {
                width: logoWidth,
                height: logoHeight,
                position: 'absolute',
                left: '50%',
                transform: [{ translateX: -logoWidth / 2 }],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.welcomeRow}>
          <View style={styles.welcomeTextBlock}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{firstName}</Text>
            <Text style={styles.tagline}>Discover elegance, crafted for you</Text>
          </View>

          <View style={styles.brandPhraseWrap}>
            <Text style={styles.brandPhrase}>
              Beauty{'\n'}Beyond Time
            </Text>
            <View style={styles.brandPhraseLine} />
          </View>
        </View>
      </View>

      {/* =========================
          LIVE RATES
      ========================= */}
      {showLiveRates && homeLiveEntries.length > 0 && (
        <View style={styles.rateCardsRow}>
          {homeLiveEntries.map((entry: any) => {
            const metal = String(entry?.metal ?? '');
            const isSilver = metal === 'silver';
            const weight = getHomeWeight(metal);
            const perGram = Number(entry?.price_per_gram ?? entry?.pricePerGram ?? 0);
            const displayPrice = Number.isFinite(perGram) && perGram > 0
              ? perGram * weight
              : Number(entry?.price_per_10_gram ?? entry?.pricePer10Gram ?? 0);
            const purity = String(entry?.purity ?? (isSilver ? 'Silver 999' : '24K'));

            return (
              <View
                key={`${metal}-${purity}`}
                style={styles.homeRateCard}
              >
                <View style={styles.homeRateIconWrap}>
                  <MaterialIcons
                    name={isSilver ? 'radio-button-checked' : 'diamond'}
                    size={isSilver ? 34 : 40}
                    color={COLORS.gold}
                  />
                </View>

                <View style={styles.homeRateInfo}>
                  <Text style={styles.homeRateTitle} numberOfLines={2}>
                    {purity}
                  </Text>

                  <Text
                    style={styles.homeRatePrice}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.62}
                  >
                    {formatPrice(displayPrice)}
                  </Text>

                  <Text style={styles.homeRateWeight} numberOfLines={1}>
                    {getWeightLabel(metal, weight)}
                  </Text>

                  <Text
                    style={styles.homeRatePerGram}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {formatPrice(perGram)}/g
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* =========================
          HERO
      ========================= */}
      {showHero && activeBanner && (
        <TouchableOpacity
          style={styles.heroBanner}
          onPress={() => router.push('/(tabs)/jewellery')}
          activeOpacity={0.88}
        >
          {activeBanner.image_url ? (
            <Image
              source={{ uri: activeBanner.image_url }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroImagePlaceholder} />
          )}

          <LinearGradient
            colors={[
              'rgba(5,5,5,0.90)',
              'rgba(5,5,5,0.62)',
              'rgba(5,5,5,0.14)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.heroGradient}
          />

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {activeBanner.title || 'Timeless Jewellery'}
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              {activeBanner.subtitle || 'A blend of tradition and modern elegance'}
            </Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Explore Collection</Text>
              <MaterialIcons name="arrow-forward" size={19} color={COLORS.primary} />
            </View>
          </View>

          <View style={styles.heroDots}>
            <View style={[styles.heroDot, styles.heroDotActive]} />
            <View style={styles.heroDot} />
            <View style={styles.heroDot} />
            <View style={styles.heroDot} />
          </View>
        </TouchableOpacity>
      )}

      {showHero && !activeBanner && (
        <TouchableOpacity
          style={styles.heroBanner}
          onPress={() => router.push('/(tabs)/jewellery')}
          activeOpacity={0.88}
        >
          <View style={styles.heroFallback}>
            <Image
              source={require('../../assets/main-logo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>Timeless Jewellery</Text>
            <Text style={styles.heroSubtitle}>
              A blend of tradition and modern elegance
            </Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Explore Collection</Text>
              <MaterialIcons name="arrow-forward" size={19} color={COLORS.primary} />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* =========================
          CATEGORIES
      ========================= */}
      {showCollections && availableCategories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{getContentValue('section_explore_collections_title', 'Explore Collections')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/jewellery')}
              activeOpacity={0.75}
            >
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {availableCategories.slice(0, 8).map((category: Category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/jewellery',
                    params: { categoryId: category.id },
                  })
                }
                activeOpacity={0.82}
              >
                <View style={styles.categoryImageWrap}>
                  {category.image_url ? (
                    <Image
                      source={{ uri: category.image_url }}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.categoryFallback}>
                      <MaterialIcons
                        name={getCategoryIcon(category.name) as any}
                        size={30}
                        color={COLORS.gold}
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* =========================
          FEATURED PRODUCTS
      ========================= */}
      {showFeatured && featuredVisible.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{getContentValue('section_featured_jewellery_title', 'Featured Jewellery')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/jewellery')}
              activeOpacity={0.75}
            >
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
          >
            {featuredVisible.map((product: Product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.featuredCard}
                onPress={() => router.push(`/product/${product.id}`)}
                activeOpacity={0.9}
              >
                <View style={styles.featuredImageWrap}>
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.featuredImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.featuredImageFallback}>
                      <MaterialIcons name="diamond" size={54} color={COLORS.gold} />
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      void toggleFavourite(product.id);
                    }}
                    activeOpacity={0.85}
                    accessibilityLabel={
                      isProductFavourite(product.id)
                        ? 'Remove from favourites'
                        : 'Add to favourites'
                    }
                  >
                    <MaterialIcons
                      name={
                        isProductFavourite(product.id)
                          ? 'favorite'
                          : 'favorite-border'
                      }
                      size={22}
                      color={
                        isProductFavourite(product.id)
                          ? '#E8B943'
                          : COLORS.white
                      }
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.featuredBody}>
                  <Text style={styles.featuredName} numberOfLines={1}>
                    {product.name}
                  </Text>

                  {(product.metal_type || product.purity) && (
                    <Text style={styles.featuredMeta} numberOfLines={1}>
                      {[product.metal_type, product.purity]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  )}

                  <Text style={styles.featuredPrice}>
                    {formatPrice(product.price)}
                  </Text>

                  <View style={styles.featuredDetailsButton}>
                    <Text style={styles.featuredDetailsText}>View Details</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* =========================
          NEW ARRIVALS
      ========================= */}
      {showNewArrivals && availableArrivals.length > 0 && (
        <View style={styles.compactSection}>
          <SectionHeader
            title={getContentValue('section_new_arrivals_title', 'New Arrivals')}
            subtitle={getContentValue('section_new_arrivals_subtitle', 'Latest additions')}
            actionText="View All"
            onAction={() => router.push('/(tabs)/jewellery')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
          >
            {availableArrivals.map((product: Product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.smallProductCard}
                onPress={() => router.push(`/product/${product.id}`)}
                activeOpacity={0.9}
              >
                <Image
                  source={
                    product.image_url
                      ? { uri: product.image_url }
                      : require('../../assets/main-logo.png')
                  }
                  style={styles.smallProductImage}
                  resizeMode="cover"
                />
                <Text style={styles.smallProductName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.smallProductPrice}>
                  {formatPrice(product.price)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* =========================
          BEST SELLERS
      ========================= */}
      {availableBestSellers.length > 0 && (
        <View style={styles.compactSection}>
          <SectionHeader
            title="Best Sellers"
            subtitle="Loved by our customers"
            actionText="View All"
            onAction={() => router.push('/(tabs)/jewellery')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
          >
            {availableBestSellers.map((product: Product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.smallProductCard}
                onPress={() => router.push(`/product/${product.id}`)}
                activeOpacity={0.9}
              >
                <Image
                  source={
                    product.image_url
                      ? { uri: product.image_url }
                      : require('../../assets/main-logo.png')
                  }
                  style={styles.smallProductImage}
                  resizeMode="cover"
                />
                <Text style={styles.smallProductName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.smallProductPrice}>
                  {formatPrice(product.price)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* =========================
          TESTIMONIALS
      ========================= */}
      {showTestimonials && Array.isArray(testimonials) && testimonials.length > 0 && (
        <View style={styles.compactSection}>
          <SectionHeader
            title={getContentValue('section_testimonials_title', 'What Our Customers Say')}
            subtitle={getContentValue('section_testimonials_subtitle', 'Customer testimonials')}
          />
          <View style={styles.testimonialsContainer}>
            {testimonials.map((testimonial: Testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                customerName={testimonial.customer_name}
                rating={testimonial.rating}
                reviewText={testimonial.review_text}
              />
            ))}
          </View>
        </View>
      )}

      {/* =========================
          ABOUT
      ========================= */}
      {showAbout && (
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>{getContentValue('section_about_title', 'About Shri Vijay Kaushal Ji Jeweller and Sons')}</Text>
          <View style={styles.aboutContent}>
            <Text style={styles.aboutText}>
              {getContentValue('about_section_text', 'Shri Vijay Kaushal Ji Jeweller and Sons brings you the finest collection of traditional and contemporary jewellery. Each piece is crafted with precision, using the highest quality gold and precious stones.')}
            </Text>
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={() => router.push('/about')}
              activeOpacity={0.8}
            >
              <Text style={styles.readMoreText}>Read More</Text>
              <MaterialIcons name="arrow-forward" size={17} color={COLORS.gold} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =========================
          CONTACT BUTTONS
      ========================= */}
      <BusinessContactButtons />

      {/* =========================
          FOOTER
      ========================= */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{getContentValue('footer_text_hindi', 'स्वर्ण आभूषण')}</Text>
        <Text style={styles.footerSubtext}>{getContentValue('footer_text_english', 'Shri Vijay Kaushal Ji Jeweller and Sons')}</Text>
        <Text style={styles.footerVersion}>{getContentValue('footer_version', 'Version 1.0.0')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },
  contentContainer: {
    paddingBottom: 130,
  },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#090909',
  },
  headerTop: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerSideSpacer: {
    width: 78,
  },
  logo: {
    position: 'absolute',
    left: '50%',
  },
  headerActions: {
    minWidth: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 9,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 16,
  },
  welcomeRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  welcomeTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: '#BFC0C4',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 15,
  },
  userName: {
    marginTop: 2,
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 34,
    lineHeight: 38,
  },
  tagline: {
    marginTop: 2,
    color: '#D0D0D0',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 14,
  },
  brandPhraseWrap: {
    alignItems: 'flex-end',
    paddingBottom: 1,
  },
  brandPhrase: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 19,
    lineHeight: 23,
    textAlign: 'right',
    letterSpacing: 0.7,
  },
  brandPhraseLine: {
    width: 46,
    height: 2,
    backgroundColor: COLORS.lightGold,
    marginTop: 5,
    marginRight: 2,
  },
  rateCardsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: 10,
    alignItems: 'stretch',
  },

  homeRateCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 150,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#5B5B5B',
    backgroundColor: '#2C2C2C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  homeRateIconWrap: {
    width: 70,
    height: 70,
    flexShrink: 0,
    borderRadius: 35,
    backgroundColor: '#454545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRateInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  homeRateTitle: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 5,
  },
  homeRatePrice: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 27,
    lineHeight: 31,
    includeFontPadding: false,
  },
  homeRateWeight: {
    color: '#D7D7D7',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  homeRatePerGram: {
    color: '#B8B8B8',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
    lineHeight: 17,
  },

  heroBanner: {
    height: 210,
    marginTop: 18,
    marginHorizontal: HORIZONTAL_PADDING,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#6A531D',
    backgroundColor: '#161616',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: undefined,
    height: undefined,
  },
  heroImagePlaceholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#171717',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 26,
    paddingRight: 135,
  },
  heroTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 34,
    lineHeight: 38,
  },
  heroSubtitle: {
    marginTop: 8,
    color: '#DFDFDF',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  heroCta: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCtaText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },
  heroDots: {
    position: 'absolute',
    right: 19,
    bottom: 17,
    flexDirection: 'row',
    gap: 7,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
  },
  heroDotActive: {
    backgroundColor: '#F2C84B',
  },
  heroFallback: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  heroLogo: {
    width: 110,
    height: 46,
    marginBottom: 8,
  },
  section: {
    marginTop: 22,
  },
  compactSection: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 21,
  },
  sectionAction: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 14,
  },
  categoriesScroll: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 12,
  },
  categoryItem: {
    width: CATEGORY_CARD_WIDTH,
    alignItems: 'center',
  },
  categoryImageWrap: {
    width: CATEGORY_CARD_WIDTH,
    height: CATEGORY_CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#755817',
    backgroundColor: '#171717',
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131313',
  },
  categoryName: {
    marginTop: 7,
    color: '#E6E6E6',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 12,
    textAlign: 'center',
  },
  productsScroll: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 13,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#434343',
  },
  featuredImageWrap: {
    height: 180,
    backgroundColor: '#111111',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: 'rgba(22,22,22,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBody: {
    padding: 12,
  },
  featuredName: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 17,
  },
  featuredMeta: {
    marginTop: 4,
    color: '#B8B8B8',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 12,
  },
  featuredPrice: {
    marginTop: 8,
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 22,
  },
  featuredDetailsButton: {
    marginTop: 11,
    minHeight: 39,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredDetailsText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 12,
  },
  smallProductCard: {
    width: 155,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#343434',
    paddingBottom: 10,
  },
  smallProductImage: {
    width: '100%',
    height: 130,
  },
  smallProductName: {
    marginTop: 9,
    paddingHorizontal: 10,
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },
  smallProductPrice: {
    marginTop: 4,
    paddingHorizontal: 10,
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 16,
  },
  testimonialsContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 12,
  },
  aboutSection: {
    marginTop: 24,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  aboutContent: {
    marginTop: 10,
  },
  aboutText: {
    color: '#B7B7B7',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 14,
    lineHeight: 22,
  },
  readMoreButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  readMoreText: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },
  footer: {
    marginTop: 25,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#242424',
    alignItems: 'center',
    marginHorizontal: HORIZONTAL_PADDING,
  },
  footerText: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 18,
  },
  footerSubtext: {
    marginTop: 4,
    color: '#969696',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 12,
  },
  footerVersion: {
    marginTop: 3,
    color: '#777777',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
  },
});
