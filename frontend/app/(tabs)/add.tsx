import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ExpoLocation from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import ImageGallery from "@/src/features/create/components/ImageGallery";
import {
  FormField,
  CategorySelector,
  ConditionSelector,
} from "@/src/features/create/components/FormFields";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import { ThemedView } from "@/src/components/ThemedView";
import { GlobalThemeWrapper } from "@/src/components/GlobalThemeComponents";
import { MessageModal } from "@/src/components/MessageModal";
import { createListingThunk } from "@/src/features/listing/listingThunks";
import {
  selectCreateStatus,
  selectCreateError,
  selectIsCreating,
  selectIsCreateSuccess,
} from "@/src/features/listing/listingSelectors";
import type {
  Category,
  Condition,
  Location,
  ListingImage,
} from "@/src/features/listing/types/listing";

const categories = [
  { id: 1, name: "Electronics", icon: "phone-portrait", color: "primary" },
  { id: 2, name: "Fashion", icon: "shirt", color: "accent" },
  { id: 3, name: "Home", icon: "home", color: "secondary" },
  { id: 4, name: "Sports", icon: "basketball", color: "accent" },
  { id: 5, name: "Books", icon: "book", color: "secondary" },
  { id: 6, name: "Toys", icon: "game-controller", color: "accent" },
  { id: 7, name: "Automotive", icon: "car", color: "secondary" },
  { id: 8, name: "Health", icon: "medical", color: "accent" },
  { id: 9, name: "Other", icon: "grid", color: "secondary" },
];

const conditions = ["new", "like_new", "good", "fair", "poor"];

export default function CreateListingScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Modal state
  const [messageModal, setMessageModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "error" | "success" | "info",
    onConfirm: undefined as (() => void) | undefined,
    showCancel: false,
  });

  const showMessage = (
    title: string,
    message: string,
    type: "error" | "success" | "info" = "info",
    onConfirm?: () => void,
    showCancel = false
  ) => {
    setMessageModal({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      showCancel,
    });
  };

  const closeMessageModal = () => {
    if (messageModal.onConfirm) {
      messageModal.onConfirm();
      setMessageModal((prev) => ({ ...prev, onConfirm: undefined }));
    }
    setMessageModal({
      visible: false,
      title: "",
      message: "",
      type: "info",
      onConfirm: undefined,
      showCancel: false,
    });
  };

  // Redux state
  const isCreating = useSelector(selectIsCreating);
  const createStatus = useSelector(selectCreateStatus);
  const createError = useSelector(selectCreateError);

  // Form state
  const [title, setTitle] = useState("MacBook Pro 16\" - M2 Max");
  const [description, setDescription] = useState(
    "Brand new MacBook Pro 16\" with M2 Max chip, 32GB RAM, 1TB SSD. Space gray color, includes original packaging and accessories. Perfect for creative professionals and developers. Selling because I received a work laptop."
  );
  const [price, setPrice] = useState("2499");
  const [quantity, setQuantity] = useState("1");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState<number>(1); // Electronics
  const [condition, setCondition] = useState<string>("new");
  const [location, setLocation] = useState("San Francisco, CA");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([
    "laptop",
    "apple",
    "macbook",
    "professional",
  ]);
  const [visibility, setVisibility] = useState("public");
  const [images, setImages] = useState<string[]>([]);

  // New database fields
  const [allowOffers, setAllowOffers] = useState(true);
  const [intentEligible, setIntentEligible] = useState(false);
  const [acceptSwaps, setAcceptSwaps] = useState(false);

  // Fetch current location on component mount and when location services setting changes
  useEffect(() => {
    const fetchLocation = async () => {
      // Check if location services are enabled in settings
      const locationEnabled = await AsyncStorage.getItem("locationServices");
      if (locationEnabled !== "true") {
        console.log(
          "Location services disabled in settings - proceeding without GPS coordinates"
        );
        setLatitude(null);
        setLongitude(null);
        return;
      }

      try {
        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await ExpoLocation.getCurrentPositionAsync({});
          const { latitude, longitude } = loc.coords;
          setLatitude(latitude);
          setLongitude(longitude);
        } else {
          console.log(
            "Location permission denied - using city/state geocoding fallback"
          );
          // Fallback to city/state geocoding
          await geocodeCityState();
        }
      } catch (error) {
        console.warn("Location permission denied or error:", error);
        // Try geocoding as fallback
        await geocodeCityState();
      }
    };

    const geocodeCityState = async () => {
      if (!location) return;

      try {
        const cityState = location
          .split(",")
          .map((part) => part.trim())
          .join(", ");
        // Use OpenStreetMap Nominatim API (free, no API key needed)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            cityState
          )}&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setLatitude(parseFloat(lat));
          setLongitude(parseFloat(lon));
          console.log("Geocoded coordinates:", {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          });
        }
      } catch (geocodeError) {
        console.warn("Geocoding failed:", geocodeError);
      }
    };

    fetchLocation();
  }, [location]); // Re-run when location text changes

  // Listen for location services setting changes
  useEffect(() => {
    const checkLocationSetting = async () => {
      const locationEnabled = await AsyncStorage.getItem("locationServices");
      if (locationEnabled === "true") {
        // Location services enabled - request permissions and get coordinates
        try {
          console.log("Location services enabled - requesting permissions...");
          const { status } =
            await ExpoLocation.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await ExpoLocation.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;
            setLatitude(latitude);
            setLongitude(longitude);
            console.log("Location services enabled ");
            // Save coordinates to storage
            await AsyncStorage.multiSet([
              ["lastLatitude", latitude.toString()],
              ["lastLongitude", longitude.toString()],
            ]);
            console.log("GPS coordinates obtained:", { latitude, longitude });
          } else {
            console.log("GPS permission denied - trying geocoding fallback");
            // Permission denied, try geocoding
            if (location) {
              const cityState = location
                .split(",")
                .map((part) => part.trim())
                .join(", ");
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                  cityState
                )}&limit=1`
              );
              const data = await response.json();

              if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setLatitude(parseFloat(lat));
                setLongitude(parseFloat(lon));

                // Save geocoded coordinates to storage
                await AsyncStorage.multiSet([
                  ["lastLatitude", lat],
                  ["lastLongitude", lon],
                ]);
                console.log("Geocoded coordinates obtained:", {
                  latitude: parseFloat(lat),
                  longitude: parseFloat(lon),
                });
              }
            }
          }
        } catch (error) {
          console.warn("Location fetch failed:", error);
        }
      } else {
        // Location services disabled - clear coordinates and storage
        setLatitude(null);
        setLongitude(null);
        try {
          await AsyncStorage.multiRemove(["lastLatitude", "lastLongitude"]);
          console.log("Cleared coordinates - location services disabled");
        } catch (error) {
          console.warn("Failed to clear location storage:", error);
        }
      }
    };

    // Check immediately and then every 2 seconds for changes
    checkLocationSetting();
    const interval = setInterval(checkLocationSetting, 2000);

    return () => clearInterval(interval);
  }, [location]);

  // Handle successful creation
  useEffect(() => {
    if (createStatus === "success") {
      showMessage("Success", "Listing created successfully!", "success", () => {
        // Reset form
        setTitle("");
        setDescription("");
        setPrice("");
        setQuantity("1");
        setCurrency("USD");
        setCategory(0);
        setCondition("");
        setLocation("");
        setTags([]);
        setVisibility("public");
        setImages([]);
        setAllowOffers(true);
        setIntentEligible(false);
        setAcceptSwaps(false);
        // Navigate back to home
        router.replace("/");
      });
    }
  }, [createStatus, router]);

  // Handle creation errors
  useEffect(() => {
    if (createError) {
      showMessage("Error", createError, "error");
    }
  }, [createError]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addImages = (uris: string[]) => {
    setImages((prev) => [...prev, ...uris]);
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !title ||
      !description ||
      !price ||
      !quantity ||
      !category ||
      !condition ||
      !location ||
      !currency ||
      !visibility
    ) {
      showMessage(
        "Missing Information",
        "Please fill in all required fields",
        "error"
      );
      return;
    }

    if (images.length === 0) {
      showMessage("Add Images", "Please add at least one image", "error");
      return;
    }

    // Parse location (assuming format "City, State")
    const [city, state] = location.split(",").map((s) => s.trim());

    // Map category ID to Category type
    const categoryMap: Record<number, Category> = {
      1: "electronics",
      2: "fashion",
      3: "home",
      4: "sports",
      5: "books",
      6: "toys",
      7: "automotive",
      8: "health",
      9: "other",
    };

    const selectedCategory = categoryMap[category];
    if (!selectedCategory) {
      showMessage("Error", "Invalid category selected", "error");
      return;
    }

    // Prepare listing images - convert local file URLs to base64
    const listingImages: ListingImage[] = await Promise.all(
      images.map(async (url, index) => {
        let imageToUse = url;

        // Convert local file URLs to base64 using expo-file-system
        if (url.startsWith("file://")) {
          try {
            console.log(`Converting image ${index + 1} to base64...`);
            const base64 = await FileSystem.readAsStringAsync(url, {
              encoding: "base64",
            });

            // Create proper data URL format
            const mimeType =
              url.endsWith(".jpg") || url.endsWith(".jpeg")
                ? "image/jpeg"
                : "image/png";
            imageToUse = `data:${mimeType};base64,${base64}`;

            console.log(
              `Image ${index + 1} converted to base64, length: ${
                imageToUse.length
              }`
            );
          } catch (error) {
            console.error("Error converting image to base64:", error);
            // For now, we'll keep the original URL and handle it on the backend
          }
        }

        return {
          id: `temp_${index}`,
          url: imageToUse,
          order: index,
          alt_text: title,
        };
      })
    );

    // Prepare location object
    const listingLocation: Location = {
      city: city || location,
      state: state || undefined,
      country: undefined,
    };

    // Prepare listing data
    const listingData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity),
      currency: currency,
      category: selectedCategory,
      condition: condition as Condition,
      location: listingLocation,
      latitude,
      longitude,
      tags: tags,
      visibility: visibility,
      images: listingImages,
      allow_offers: allowOffers,
      intent_eligible: intentEligible,
      accept_swaps: acceptSwaps,
    };

    // Dispatch create listing thunk
    dispatch(createListingThunk(listingData) as any);
  };

  return (
    <GlobalThemeWrapper
      useFullPage={true}
      style={{ paddingBottom: insets.bottom }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.colors.surface,
                paddingTop: 12 + insets.top,
              },
            ]}
          >
            <View style={styles.headerTop}>
              <ThemedText type="heading" style={styles.title}>
                Create Listing
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  { backgroundColor: theme.colors.primary },
                  isCreating && styles.postButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isCreating}
                activeOpacity={0.9}
              >
                {isCreating ? (
                  <Ionicons
                    name="hourglass-outline"
                    size={18}
                    color={theme.colors.surface}
                  />
                ) : (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={theme.colors.surface}
                  />
                )}
                <Text style={[styles.postButtonText]}>
                  {isCreating ? "Posting..." : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formContainer}>
            <ImageGallery
              images={images}
              onAddImages={addImages}
              onRemoveImage={removeImage}
            />

            <FormField
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="What are you selling?"
              maxLength={80}
            />

            <FormField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your item..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <FormField
              label="Price"
              value={price}
              onChangeText={setPrice}
              placeholder="$0.00"
              keyboardType="numeric"
            />

            <FormField
              label="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              keyboardType="numeric"
            />

            <FormField
              label="Currency"
              value={currency}
              onChangeText={setCurrency}
              placeholder="USD"
            />

            <FormField
              label="Tags (comma separated)"
              value={tags.join(", ")}
              onChangeText={(text) =>
                setTags(
                  text
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                )
              }
              placeholder="electronics, smartphone, apple"
            />

            <CategorySelector
              categories={categories}
              selectedCategory={category}
              onSelectCategory={setCategory}
            />

            <ConditionSelector
              conditions={conditions}
              selectedCondition={condition}
              onSelectCondition={setCondition}
            />

            <FormField
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="City, State"
            />

            <View style={styles.toggleSection}>
              <ThemedText type="subheading" style={styles.toggleSectionTitle}>
                Listing Options
              </ThemedText>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <ThemedText type="body" style={styles.toggleLabel}>
                    Allow Offers
                  </ThemedText>
                  <ThemedText type="caption" style={styles.toggleDescription}>
                    Buyers can send price offers
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    allowOffers && styles.toggleActive,
                    {
                      backgroundColor: allowOffers
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => setAllowOffers(!allowOffers)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      {
                        backgroundColor: allowOffers
                          ? "#FFFFFF"
                          : theme.colors.secondary,
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <ThemedText type="body" style={styles.toggleLabel}>
                    Intent Eligible
                  </ThemedText>
                  <ThemedText type="caption" style={styles.toggleDescription}>
                    Show in buyer request matches
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    intentEligible && styles.toggleActive,
                    {
                      backgroundColor: intentEligible
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => setIntentEligible(!intentEligible)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      {
                        backgroundColor: intentEligible
                          ? "#FFFFFF"
                          : theme.colors.secondary,
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <ThemedText type="body" style={styles.toggleLabel}>
                    Accept Swaps
                  </ThemedText>
                  <ThemedText type="caption" style={styles.toggleDescription}>
                    Willing to trade items
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    acceptSwaps && styles.toggleActive,
                    {
                      backgroundColor: acceptSwaps
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => setAcceptSwaps(!acceptSwaps)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      {
                        backgroundColor: acceptSwaps
                          ? "#FFFFFF"
                          : theme.colors.secondary,
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MessageModal
        visible={messageModal.visible}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
        onConfirm={messageModal.onConfirm}
        showCancel={messageModal.showCancel}
        onClose={closeMessageModal}
      />
    </GlobalThemeWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingBottom: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  backButton: {
    marginRight: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    flex: 1,
  },

  postButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  postButtonText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#FFFFFF",
  },

  postButtonDisabled: {
    opacity: 0.6,
  },

  formContainer: {
    paddingHorizontal: 20,
  },

  toggleSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  toggleSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },

  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },

  toggleDescription: {
    fontSize: 14,
    opacity: 0.7,
  },

  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  toggleActive: {
    // Active state handled by theme color
  },

  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
});
