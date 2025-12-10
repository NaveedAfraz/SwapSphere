// app/(auth)/sign-in.tsx
import React from "react";
import { View, Text, Dimensions, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import type { AppDispatch } from "@/src/lib/store/index";
import ReusableAuthForm from "@/src/features/auth/components/reusableAuthform";
import { loginThunk } from "@/src/features/auth/authThunks";
import { loginSchema } from "@/src/features/auth/utils/validators";
import type { LoginPayload } from "@/src/features/auth/types/auth";
import { authScreenStyles } from "@/src/features/auth/styles/authScreenStyles";
 

export default function SignInScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleSubmit = async (data: LoginPayload) => {
    const result = await dispatch(loginThunk(data))
      .unwrap()
      .catch((e) => {
        // handle server error: show toast / set errors
        console.error("Login failed", e);
      });
    if (result) {
      // navigate to home or previous screen
      router.replace("/(auth)/profile-setup");
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
          <Text style={authScreenStyles.subtitle}>Sign in to continue to SwapSphere</Text>
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
            <Text style={authScreenStyles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={authScreenStyles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}
