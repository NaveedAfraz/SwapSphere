// app/(auth)/sign-in.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import type { AppDispatch } from "../../store";
import ReusableAuthForm from "@/src/features/auth/components/reusableAuthform";
import ErrorModal from "@/src/features/auth/components/ErrorModal";
import { loginThunk } from "@/src/features/auth/authThunks";
import { loginSchema } from "@/src/features/auth/utils/validators";
import type { LoginPayload } from "@/src/features/auth/types/auth";
import { authScreenStyles } from "@/src/features/auth/styles/authScreenStyles";

export default function SignInScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const closeErrorModal = () => {
    setErrorModal({
      visible: false,
      title: "",
      message: "",
    });
  };

  const handleSubmit = async (data: LoginPayload) => {
    try {
      const result = await dispatch(loginThunk(data)).unwrap();

      if (result) {
        console.log("Login successful, navigating to home page");
        // navigate to home page after successful login
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      // Show user-friendly error message using custom modal
      setErrorModal({
        visible: true,
        title: "Login Failed",
        message: error || "Invalid email or password. Please try again.",
      });
    }
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
          <Text style={authScreenStyles.title}>Welcome Back</Text>
          <Text style={authScreenStyles.subtitle}>
            Sign in to continue to SwapSphere
          </Text>
          <View style={authScreenStyles.decorativeCircle} />
          <View style={authScreenStyles.decorativeCircleSmall} />
        </LinearGradient>

        <View style={authScreenStyles.formContainer}>
          <View style={authScreenStyles.handleBar} />

          <ReusableAuthForm
            schema={loginSchema}
            fields={[
              {
                name: "email",
                label: "Email",
                placeholder: "you@domain.com",
                type: "email",
              },
              {
                name: "password",
                label: "Password",
                placeholder: "Enter password",
                type: "password",
              },
            ]}
            defaultValues={{ email: "", password: "" }}
            submitLabel="Sign in"
            onSubmit={handleSubmit}
          />

          <View style={authScreenStyles.registerContainer}>
            <Text style={authScreenStyles.registerText}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={authScreenStyles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={closeErrorModal}
      />
    </>
  );
}
