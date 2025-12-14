import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImageGallery from "@/src/features/create/components/ImageGallery";
import {
  FormField,
  CategorySelector,
  ConditionSelector,
} from "@/src/features/create/components/FormFields";

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  surface: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  success: "#22C55E",
  error: "#DC2626",
  gold: "#FACC15",
  chipBg: "#F3F4F6",
};

const categories = [
  { id: 1, name: "Fashion", icon: "", color: "#FFE66D" },
  { id: 2, name: "Tech", icon: "", color: "#95E1D3" },
  { id: 3, name: "Home", icon: "", color: "#F6C1C1" },
  { id: 4, name: "Fitness", icon: "", color: "#F38181" },
];

const conditions = ["New", "Like New", "Good", "Fair"];

export default function CreateScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<number | null>(null);
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addImages = (uris: string[]) => {
    setImages((prev) => [...prev, ...uris]);
  };

  const handleSubmit = () => {
    if (
      !title ||
      !description ||
      !price ||
      !category ||
      !condition ||
      !location
    ) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Add Images", "Please add at least one image");
      return;
    }

    Alert.alert("Success", "Listing created successfully!");

    setTitle("");
    setDescription("");
    setPrice("");
    setCategory(null);
    setCondition("");
    setLocation("");
    setImages([]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Listing</Text>
          <TouchableOpacity
            style={styles.postButton}
            onPress={handleSubmit}
            activeOpacity={0.9}
          >
            <Ionicons name="checkmark" size={18} color={COLORS.white} />
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  backButton: {
    marginRight: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
    flex: 1,
  },

  postButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.dark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  postButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },

  formContainer: {
    paddingHorizontal: 20,
  },
});
