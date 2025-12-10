// app/(auth)/sign-up.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import type { AppDispatch } from "@/src/lib/store/index";
import ReusableAuthForm from "@/src/features/auth/components/reusableAuthform";
import { registerThunk } from "@/src/features/auth/authThunks";
import { registerSchema } from "@/src/features/auth/utils/validators";
import type { RegisterPayload } from "@/src/features/auth/types/auth";
import { authScreenStyles } from "@/src/features/auth/styles/authScreenStyles";
  
const { height } = Dimensions.get("window");

export default function SignUpScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const result = await dispatch(registerThunk(data))
      .unwrap()
      .catch((e) => {
        console.error("Register failed", e);
      });
    if (result) {
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
        extraScrollHeight={300}
      >
        <LinearGradient
          colors={["#f8f9fa", "#ecf0f1"]}
          style={authScreenStyles.animationContainer}
        >
          <LottieView
            source={require("../../assets/TemanASN Home Mobile.json")}
            autoPlay
            loop
            style={authScreenStyles.lottieAnimation}
          />
          <Text style={authScreenStyles.title}>Create Account</Text>
          <Text style={authScreenStyles.subtitle}>
            Join SwapSphere and start your journey
          </Text>
          <View style={authScreenStyles.decorativeCircle} />
          <View style={authScreenStyles.decorativeCircleSmall} />
        </LinearGradient>

        <View style={authScreenStyles.formContainer}>
          <View style={authScreenStyles.handleBar} />
          
          <ReusableAuthForm
            schema={registerSchema}
            fields={[
              {
                name: "name",
                label: "Full name",
                placeholder: "John Doe",
                type: "text",
              },
              {
                name: "email",
                label: "Email",
                placeholder: "you@domain.com",
                type: "email",
              },
              {
                name: "password",
                label: "Password",
                placeholder: "Create password",
                type: "password",
              },
              {
                name: "confirmPassword",
                label: "Confirm",
                placeholder: "Repeat password",
                type: "password",
              },
            ]}
            defaultValues={{
              name: "",
              email: "",
              password: "",
              confirmPassword: "",
            }}
            submitLabel="Create account"
            onSubmit={handleSubmit}
          />

          <View style={authScreenStyles.registerContainer}>
            <Text style={authScreenStyles.registerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
              <Text style={authScreenStyles.registerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}
