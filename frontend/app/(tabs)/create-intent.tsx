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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import { MessageModal } from "@/src/components/MessageModal";
import { GlobalThemeWrapper } from "@/src/components/GlobalThemeComponents";
import {
  FormField,
  CategorySelector,
} from "@/src/features/create/components/FormFields";
import {
  createIntentThunk,
  updateIntentThunk,
  getIntentThunk,
} from "@/src/features/intents/intentThunks";
import {
  selectCreateStatus,
  selectCreateError,
  selectUpdateStatus,
  selectUpdateError,
  selectCurrentIntent,
  isCreating,
  isUpdating,
} from "@/src/features/intents/intentSlice";

const categories = [
  { id: 1, name: "Electronics", icon: "phone-portrait", color: "#3B82F6" },
  { id: 2, name: "Fashion", icon: "shirt", color: "#3B82F6" },
  { id: 3, name: "Home", icon: "home", color: "#3B82F6" },
  { id: 4, name: "Sports", icon: "basketball", color: "#3B82F6" },
  { id: 5, name: "Books", icon: "book", color: "#3B82F6" },
  { id: 6, name: "Toys", icon: "game-controller", color: "#3B82F6" },
  { id: 7, name: "Automotive", icon: "car", color: "#3B82F6" },
  { id: 8, name: "Health", icon: "medical", color: "#3B82F6" },
  { id: 9, name: "Other", icon: "grid", color: "#3B82F6" },
];

export default function CreateIntentScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  // Determine if we're in edit mode
  const isEditMode = !!id;

  // Redux state
  const isCreatingIntent = useSelector(isCreating);
  const isUpdatingIntent = useSelector(isUpdating);
  const createStatus = useSelector(selectCreateStatus);
  const updateStatus = useSelector(selectUpdateStatus);
  const createError = useSelector(selectCreateError);
  const updateError = useSelector(selectUpdateError);
  const currentIntent = useSelector(selectCurrentIntent);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState<number>(0);
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Modal state
  const [messageModal, setMessageModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: 'info' as 'error' | 'success' | 'info',
  });

  const showMessage = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info', onSuccess?: () => void) => {
    setMessageModal({
      visible: true,
      title,
      message,
      type,
    });
    
    // Store success callback if provided
    if (type === 'success' && onSuccess) {
      (window as any).successCallback = onSuccess;
    }
  };

  const closeMessageModal = () => {
    // Execute success callback if it exists
    if ((window as any).successCallback) {
      (window as any).successCallback();
      delete (window as any).successCallback;
    }
    
    setMessageModal({
      visible: false,
      title: "",
      message: "",
      type: 'info',
    });
  };

  // Fetch intent data on component mount if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      dispatch(getIntentThunk(id) as any);
    }
  }, [dispatch, id, isEditMode]);

  // Populate form fields when intent data is loaded
  useEffect(() => {
    if (currentIntent && isEditMode) {
      setTitle(currentIntent.title);
      setDescription(currentIntent.description);
      setMaxPrice(currentIntent.max_price.toString());
      setLocation(
        `${currentIntent.location.city}${
          currentIntent.location.state
            ? `, ${currentIntent.location.state}`
            : ""
        }`
      );

      // Map category name to ID
      const categoryMap: Record<string, number> = {
        electronics: 1,
        fashion: 2,
        home: 3,
        sports: 4,
        books: 5,
        toys: 6,
        automotive: 7,
        health: 8,
        other: 9,
      };

      setCategory(categoryMap[currentIntent.category] || 0);
      setIsLoading(false);
    }
  }, [currentIntent, isEditMode]);

  // Handle errors
  useEffect(() => {
    if (createError) {
      showMessage("Error", createError, 'error');
    }
    if (updateError) {
      showMessage("Error", updateError, 'error');
    }
  }, [createError, updateError]);

  const handleSubmit = async () => {
    // Validation
    if (!title || !description || !maxPrice || !category || !location) {
      showMessage("Missing Information", "Please fill in all required fields", 'error');
      return;
    }

    // Map category ID to category name
    const categoryMap: Record<number, string> = {
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
      showMessage("Error", "Invalid category selected", 'error');
      return;
    }

    // Prepare intent data
    const intentData = {
      title: title.trim(),
      description: description.trim(),
      max_price: parseFloat(maxPrice),
      category: selectedCategory,
      location: {
        city: location.split(",")[0]?.trim() || location,
        state: location.split(",")[1]?.trim(),
      },
    };

    // Dispatch appropriate thunk based on mode
    let result;
    if (isEditMode && id) {
      result = await dispatch(
        updateIntentThunk({ id, data: intentData }) as any
      );
    } else {
      result = await dispatch(createIntentThunk(intentData) as any);
    }

    if (
      (isEditMode ? updateIntentThunk : createIntentThunk).fulfilled.match(
        result
      )
    ) {
      const successMessage = isEditMode
        ? "Your buyer request has been updated!"
        : "Your buyer request has been posted!";
      showMessage("Success", successMessage, 'success', () => {
        // Reset form
        setTitle("");
        setDescription("");
        setMaxPrice("");
        setCategory(0);
        setLocation("");
        // Navigate back to profile
        router.replace("/(tabs)/profile");
      });
    }
  };

  if (isLoading) {
    return (
      <GlobalThemeWrapper useFullPage={true}>
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons
            name="hourglass-outline"
            size={48}
            color={theme.colors.secondary}
          />
          <ThemedText type="body" style={styles.loadingText}>
            Loading...
          </ThemedText>
        </View>
      </GlobalThemeWrapper>
    );
  }

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
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: theme.colors.background,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            <View style={styles.headerTop}>
              {isEditMode && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              )}
              <ThemedText type="heading" style={styles.title}>
                {isEditMode ? "Edit Buyer Request" : "Create Buyer Request"}
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  { backgroundColor: theme.colors.primary },
                  (isCreatingIntent || isUpdatingIntent) &&
                    styles.postButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isCreatingIntent || isUpdatingIntent}
                activeOpacity={0.9}
              >
                {isCreatingIntent || isUpdatingIntent ? (
                  <Ionicons
                    name="hourglass-outline"
                    size={18}
                    color={theme.colors.surface}
                  />
                ) : (
                  <Ionicons name="checkmark" size={18} color={theme.colors.surface} />
                )}
                <Text style={[styles.postButtonText]}>
                  {isCreatingIntent || isUpdatingIntent
                    ? isEditMode
                      ? "Updating..."
                      : "Posting..."
                    : isEditMode
                    ? "Update"
                    : "Post"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View
                style={[
                  styles.helpCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Ionicons
                  name="bulb-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <ThemedText type="caption" style={styles.helpText}>
                  {isEditMode
                    ? "Edit your buyer request to help sellers find you faster"
                    : "Create your buyer request to help sellers find you faster"}
                </ThemedText>
              </View>

              <FormField
                label="What are you looking for?"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., iPhone 13 Pro, MacBook Pro, Gaming Laptop"
                maxLength={80}
              />

              <FormField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Provide details about what you need, condition preferences, etc."
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              <FormField
                label="Maximum Budget"
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="$0.00"
                keyboardType="numeric"
              />

              <CategorySelector
                categories={categories}
                selectedCategory={category}
                onSelectCategory={setCategory}
              />

              <FormField
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="City, State"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <MessageModal
        visible={messageModal.visible}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
        onClose={closeMessageModal}
      />
    </GlobalThemeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
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
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  backButton: {
    marginRight: 16,
  },

  title: {
    fontSize: 24,
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

  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  helpText: {
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
});
