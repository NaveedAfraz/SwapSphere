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
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system/legacy';
import { AppDispatch, RootState } from "@/src/store";
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
  const isOAuthUser = false;

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    seller_mode: false,
    location: "",
    password: "", // For OAuth users who want to set a password
  });

  const [profilePicture, setProfilePicture] = useState<{
    uri: string;
    mime: string;
    size: number;
  } | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Please grant camera roll permissions to upload a profile picture.");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile picture
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        try {
          // Convert image URI to base64 using React Native FileSystem
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
          
          const base64dataUrl = `data:${asset.mimeType || 'image/jpeg'};base64,${base64}`;
          
          setProfilePicture({
            uri: base64dataUrl,
            mime: asset.mimeType || 'image/jpeg',
            size: asset.fileSize || 0,
          });
        } catch (conversionError) {
          // Fallback: try using the original URI (though this won't work with current backend)
          setProfilePicture({
            uri: asset.uri,
            mime: asset.mimeType || 'image/jpeg',
            size: asset.fileSize || 0,
          });
          
          Alert.alert("Warning", "Image conversion failed. Using original URI which may not work with server.");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

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

      // Include profile picture data if selected
      if (profilePicture) {
        profileData.avatar_key = `profile_${Date.now()}`;
        profileData.profile_picture_url = profilePicture.uri;
        profileData.profile_picture_mime_type = profilePicture.mime;
        profileData.profile_picture_size_bytes = profilePicture.size;
      }

      // Only include password if it's provided (for OAuth users)
      if (formData.password) {
        profileData.password = formData.password;
      }

      const result = await dispatch(updateProfileThunk(profileData)).unwrap();

      if (result) {
        // Navigate directly without showing alert
        router.replace("/(tabs)" as any);
      }
    } catch (error) {
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
          onPress: () => router.replace("/(tabs)" as any),
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
          <Text style={authScreenStyles.subtitle}>
            Tell us a bit about yourself
          </Text>
          <View style={authScreenStyles.decorativeCircle} />
          <View style={authScreenStyles.decorativeCircleSmall} />
        </LinearGradient>

        <View style={authScreenStyles.formContainer}>
          <View style={authScreenStyles.handleBar} />

          {/* Profile Picture Section */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ position: 'relative' }}>
              {/* Profile Picture Circle */}
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: '#f0f0f0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: '#3498db',
                  overflow: 'hidden',
                }}
              >
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture.uri }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 60,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={40} color="#bdc3c7" />
                )}
              </View>
              
              {/* Camera Button */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  backgroundColor: '#3498db',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: '#fff',
                }}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Profile Picture Actions */}
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#7f8c8d', marginBottom: 8 }}>
                Add a profile picture
              </Text>
              {profilePicture && (
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: '#e74c3c',
                    borderRadius: 16,
                  }}
                  onPress={removeProfilePicture}
                >
                  <Text style={{ fontSize: 12, color: '#e74c3c' }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ gap: 20 }}>
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginBottom: 8,
                }}
              >
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
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginBottom: 8,
                }}
              >
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
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginBottom: 8,
                }}
              >
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
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#2c3e50" }}
                >
                  Enable Seller Mode
                </Text>
                <Switch
                  value={formData.seller_mode}
                  onValueChange={(value) =>
                    handleInputChange("seller_mode", value)
                  }
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
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#2c3e50",
                    marginBottom: 8,
                  }}
                >
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
                  Optional: Set a password to enable email login (min. 8
                  characters)
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
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                >
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
              <Text
                style={{ color: "#3498db", fontSize: 16, fontWeight: "600" }}
              >
                Skip for Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}
