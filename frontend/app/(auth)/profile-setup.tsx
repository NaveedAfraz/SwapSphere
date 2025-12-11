import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AppDispatch, RootState } from "@/src/lib/store";
import { updateProfileThunk } from "@/src/features/auth/authThunks";
import { authScreenStyles } from "@/src/features/auth/styles/authScreenStyles";
import { any } from "zod";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isLoading = useSelector(
    (state: RootState) => state.auth.status === "loading"
  );

  // For now, show password field for all users as a fallback
  // TODO: Implement proper OAuth detection through route params or auth state
  const isOAuthUser = false; // Temporary - will be updated based on OAuth flow

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    seller_mode: false,
    location: "",
    password: "", // For OAuth users who want to set a password
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    // Validate password if provided
    if (formData.password && formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    try {
      const profileData: any = {
        name: formData.name,
        bio: formData.bio,
        seller_mode: formData.seller_mode,
        location: formData.location ? { city: formData.location } : null,
      };

      // Only include password if it's provided (for OAuth users)
      if (formData.password) {
        profileData.password = formData.password;
      }

      const result = await dispatch(updateProfileThunk(profileData)).unwrap();

      console.log("Profile setup result:", result);

      if (result) {
        console.log("Profile setup successful, navigating to home page automatically");
        // Navigate directly without showing alert
        router.replace("/(tabs)/index" as any);
      } else {
        console.log("No result returned from profile setup");
      }
    } catch (error) {
      console.error("Profile setup error caught:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const skipSetup = () => {
    Alert.alert(
      "Skip Setup",
      "You can complete your profile later from settings.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Skip",
          onPress: () => router.replace("/(tabs)/index" as any),
        }, 
      ]
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <KeyboardAwareScrollView
        style={authScreenStyles.container}
        contentContainerStyle={authScreenStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={60}
      >
        <LinearGradient
          colors={["#f8f9fa", "#ecf0f1"]}
          style={authScreenStyles.animationContainer}
        >
          <LottieView
            source={require("../../assets/Login.json")}
            autoPlay
            loop
            style={authScreenStyles.lottieAnimation}
          />
          <Text style={authScreenStyles.title}>Complete Your Profile</Text>
          <Text style={authScreenStyles.subtitle}>Tell us a bit about yourself</Text>
          <View style={authScreenStyles.decorativeCircle} />
          <View style={authScreenStyles.decorativeCircleSmall} />
        </LinearGradient>

        <View style={authScreenStyles.formContainer}>
          <View style={authScreenStyles.handleBar} />
          
          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#2c3e50", marginBottom: 8 }}>
                Name *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e1e8ed",
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: "#f8f9fa",
                }}
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                placeholder="Enter your name"
                maxLength={50}
              />
            </View>

            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#2c3e50", marginBottom: 8 }}>
                Bio
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e1e8ed",
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: "#f8f9fa",
                  height: 100,
                  textAlignVertical: "top",
                }}
                value={formData.bio}
                onChangeText={(value) => handleInputChange("bio", value)}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                maxLength={200}
              />
            </View>

            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#2c3e50", marginBottom: 8 }}>
                Location
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e1e8ed",
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: "#f8f9fa",
                }}
                value={formData.location}
                onChangeText={(value) => handleInputChange("location", value)}
                placeholder="City, Country"
                maxLength={100}
              />
            </View>

            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#2c3e50" }}>
                  Enable Seller Mode
                </Text>
                <Switch
                  value={formData.seller_mode}
                  onValueChange={(value) => handleInputChange("seller_mode", value)}
                  trackColor={{ false: "#e1e8ed", true: "#3498db" }}
                  thumbColor={formData.seller_mode ? "#ffffff" : "#ffffff"}
                />
              </View>
              <Text style={{ fontSize: 14, color: "#7f8c8d" }}>
                Enable seller mode to list items for sale
              </Text>
            </View>

            {isOAuthUser && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#2c3e50", marginBottom: 8 }}>
                Set Password (Optional)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e1e8ed",
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: "#f8f9fa",
                }}
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                placeholder="Create a password for email login"
                secureTextEntry
                maxLength={128}
              />
              <Text style={{ fontSize: 14, color: "#7f8c8d", marginTop: 4 }}>
                Optional: Set a password to enable email login (min. 8 characters)
              </Text>
            </View>
          )}
          </View>
          
          <View style={{ gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "#3498db",
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  Complete Setup
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "#3498db",
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={skipSetup}
            >
              <Text style={{ color: "#3498db", fontSize: 16, fontWeight: "600" }}>
                Skip for Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}
