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

export default function CreateScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Redux state
  const isCreating = useSelector(selectIsCreating);
  const createStatus = useSelector(selectCreateStatus);
  const createError = useSelector(selectCreateError);

  // Form state
  const [title, setTitle] = useState("iPhone 13 Pro - Excellent Condition");
  const [description, setDescription] = useState(
    "Perfect condition iPhone 13 Pro, barely used. Includes original box, charger, and headphones. No scratches or dents, battery health at 95%. Selling because I upgraded to the latest model."
  );
  const [price, setPrice] = useState("899");
  const [quantity, setQuantity] = useState("1");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState<number>(1); // Electronics
  const [condition, setCondition] = useState<string>("new");
  const [location, setLocation] = useState("New York, NY");
  const [tags, setTags] = useState<string[]>([
    "electronics",
    "smartphone",
    "apple",
  ]);
  const [visibility, setVisibility] = useState("public");
  const [images, setImages] = useState<string[]>([]);

  // Handle successful creation
  useEffect(() => {
    if (createStatus === "success") {
      Alert.alert("Success", "Listing created successfully!", [
        {
          text: "OK",
          onPress: () => {
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
            // Navigate back to home
            router.replace("/(tabs)");
          },
        },
      ]);
    }
  }, [createStatus, router]);

  // Handle creation errors
  useEffect(() => {
    if (createError) {
      Alert.alert("Error", createError);
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
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Add Images", "Please add at least one image");
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
      Alert.alert("Error", "Invalid category selected");
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
      tags: tags,
      visibility: visibility,
      images: listingImages,
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
                  <Ionicons name="hourglass-outline" size={18} />
                ) : (
                  <Ionicons name="checkmark" size={18} />
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },

  postButtonDisabled: {
    opacity: 0.6,
  },

  formContainer: {
    paddingHorizontal: 20,
  },
});
