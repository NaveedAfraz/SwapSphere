import type { RootState } from "../../store";
import type {
  ListingState,
  Listing,
  Category,
  Condition,
} from "./types/listing";

// Basic selectors
export const selectListingState = (state: RootState): ListingState =>
  state.listing;

export const selectListings = (state: RootState): Listing[] =>
  state.listing.listings;

export const selectCurrentListing = (state: RootState): Listing | null =>
  state.listing.currentListing;

export const selectFavorites = (state: RootState): Listing[] =>
  state.listing.favorites;

export const selectListingStatus = (state: RootState): ListingState["status"] =>
  state.listing.status;

export const selectListingError = (state: RootState): string | null =>
  state.listing.error ?? null;

export const selectCreateStatus = (
  state: RootState
): ListingState["createStatus"] => state.listing.createStatus;

export const selectCreateError = (state: RootState): string | null =>
  state.listing.createError ?? null;

export const selectUpdateStatus = (
  state: RootState
): ListingState["updateStatus"] => state.listing.updateStatus;

export const selectUpdateError = (state: RootState): string | null =>
  state.listing.updateError ?? null;

export const selectPagination = (state: RootState) => state.listing.pagination;

export const selectFilters = (state: RootState) => state.listing.filters;

// Derived selectors
export const selectIsListingsLoading = (state: RootState): boolean =>
  state.listing.status === "loading";

export const selectIsListingsError = (state: RootState): boolean =>
  state.listing.status === "error";

export const selectIsListingsSuccess = (state: RootState): boolean =>
  state.listing.status === "success";

export const selectIsListingsIdle = (state: RootState): boolean =>
  state.listing.status === "idle";

export const selectIsCreating = (state: RootState): boolean =>
  state.listing.createStatus === "loading";

export const selectIsCreateError = (state: RootState): boolean =>
  state.listing.createStatus === "error";

export const selectIsCreateSuccess = (state: RootState): boolean =>
  state.listing.createStatus === "success";

export const selectIsUpdating = (state: RootState): boolean =>
  state.listing.updateStatus === "loading";

export const selectIsUpdateError = (state: RootState): boolean =>
  state.listing.updateStatus === "error";

export const selectIsUpdateSuccess = (state: RootState): boolean =>
  state.listing.updateStatus === "success";

export const selectHasMoreListings = (state: RootState): boolean =>
  state.listing.pagination.hasMore;

export const selectTotalListings = (state: RootState): number =>
  state.listing.pagination.total;

// Listing-specific selectors
export const selectListingById = (
  state: RootState,
  listingId: string
): Listing | null => {
  return (
    state.listing.listings.find((listing) => listing.id === listingId) || null
  );
};

export const selectFavoriteById = (
  state: RootState,
  listingId: string
): Listing | null => {
  return (
    state.listing.favorites.find((listing) => listing.id === listingId) || null
  );
};

export const selectIsFavorite = (
  state: RootState,
  listingId: string
): boolean => {
  return state.listing.favorites.some((listing) => listing.id === listingId);
};

// Filter selectors
export const selectListingsByCategory = (
  state: RootState,
  category: Category
): Listing[] => {
  return state.listing.listings.filter(
    (listing) => listing.category === category
  );
};

export const selectListingsByCondition = (
  state: RootState,
  condition: Condition
): Listing[] => {
  return state.listing.listings.filter(
    (listing) => listing.condition === condition
  );
};

export const selectListingsByPriceRange = (
  state: RootState,
  minPrice: number,
  maxPrice: number
): Listing[] => {
  return state.listing.listings.filter((listing) => {
    const price = parseFloat(listing.price);
    return price >= minPrice && price <= maxPrice;
  });
};

export const selectActiveListings = (state: RootState): Listing[] => {
  return state.listing.listings.filter((listing) => listing.is_published);
};

export const selectSoldListings = (state: RootState): Listing[] => {
  // Note: API doesn't have status field, using is_published as proxy
  return state.listing.listings.filter((listing) => !listing.is_published);
};

export const selectMyListings = (state: RootState): Listing[] => {
  // This would need to be filtered by seller_id from auth state
  return state.listing.listings;
};

// Search and sort selectors
export const selectSortedListings = (state: RootState): Listing[] => {
  const { listings, filters } = state.listing;
  const { sortBy, sortOrder } = filters;

  const sorted = [...listings].sort((a, b) => {
    switch (sortBy) {
      case "price":
        const priceA = parseFloat(a.price);
        const priceB = parseFloat(b.price);
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      case "popularity":
        const favA = parseInt(a.favorites_count);
        const favB = parseInt(b.favorites_count);
        return sortOrder === "asc" ? favA - favB : favB - favA;
      case "created_at":
      default:
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  return sorted;
};

export const selectFilteredListings = (state: RootState): Listing[] => {
  let filtered = selectSortedListings(state);

  const { filters } = state.listing;

  if (filters.category) {
    filtered = filtered.filter(
      (listing) => listing.category === filters.category
    );
  }

  if (filters.condition) {
    filtered = filtered.filter(
      (listing) => listing.condition === filters.condition
    );
  }

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter(
      (listing) => parseFloat(listing.price) >= filters.minPrice!
    );
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter(
      (listing) => parseFloat(listing.price) <= filters.maxPrice!
    );
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (listing) =>
        listing.title.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
};

// Complex selectors
export const selectListingInfo = (state: RootState) => ({
  listings: selectListings(state),
  currentListing: selectCurrentListing(state),
  favorites: selectFavorites(state),
  status: selectListingStatus(state),
  createStatus: selectCreateStatus(state),
  updateStatus: selectUpdateStatus(state),
  error: selectListingError(state),
  createError: selectCreateError(state),
  updateError: selectUpdateError(state),
  pagination: selectPagination(state),
  filters: selectFilters(state),
});

export const selectListingStats = (state: RootState) => {
  const listings = selectListings(state);

  return {
    total: listings.length,
    active: listings.filter((l) => l.is_published).length,
    sold: listings.filter((l) => !l.is_published).length,
    pending: 0, // API doesn't have pending status
    totalValue: listings.reduce((sum, l) => sum + parseFloat(l.price), 0),
    avgPrice:
      listings.length > 0
        ? listings.reduce((sum, l) => sum + parseFloat(l.price), 0) /
          listings.length
        : 0,
  };
};

export const selectCategoryStats = (state: RootState) => {
  const listings = selectListings(state);
  const stats: Record<Category, number> = {
    electronics: 0,
    fashion: 0,
    home: 0,
    sports: 0,
    books: 0,
    toys: 0,
    automotive: 0,
    health: 0,
    other: 0,
  };

  listings.forEach((listing) => {
    stats[listing.category]++;
  });

  return stats;
};
