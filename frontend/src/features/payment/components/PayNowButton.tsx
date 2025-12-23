import React, { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/src/store";
import { createPaymentOrderThunk, capturePayPalPaymentThunk } from "../paymentThunks";
import { Interactions } from "@/src/constants/theme";
import { ThemedText } from "@/src/components/ThemedView";
import PayPalWebView from "./PayPalWebView";

interface PayNowButtonProps {
  orderId: string;
  amount: number;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export default function PayNowButton({
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError,
}: PayNowButtonProps) {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [paypalModalVisible, setPaypalModalVisible] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState("");

  const handlePayNow = async () => {
    if (!orderId) {
      Alert.alert("Error", "Order ID is required for payment");
      return;
    }

    setLoading(true);
    try {
      const response = await dispatch(createPaymentOrderThunk({ orderId, amount })).unwrap();

      if (response.approval_url) {
        setApprovalUrl(response.approval_url);
        setPaypalModalVisible(true);
      } else {
        throw new Error("No approval URL received from PayPal");
      }
    } catch (error: any) {
      const msg = error.message || "Payment failed. Please try again.";
      onPaymentError?.(msg);
      Alert.alert("Payment Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.accent,
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 48,
        }}
        onPress={handlePayNow}
        disabled={loading}
        activeOpacity={Interactions.buttonOpacity}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <ThemedText style={{ color: "#FFF", fontWeight: "600" }}>
              Pay Now
            </ThemedText>
            <ThemedText style={{ color: "#FFF", marginLeft: 8 }}>
              ${amount ? amount.toFixed(2) : "0.00"}
            </ThemedText>
          </>
        )}
      </TouchableOpacity>

      <PayPalWebView
        visible={paypalModalVisible}
        approvalUrl={approvalUrl}
        onSuccess={async ({ token }) => {
          try {
            setPaypalModalVisible(false);
            await dispatch(capturePayPalPaymentThunk(token)).unwrap(); // backend capture API
            onPaymentSuccess?.();
            Alert.alert("Payment Successful", "Payment completed successfully!");
          } catch (err: any) {
            console.log('[PayNowButton] Capture error:', err);
            
            // Check if this is an INSTRUMENT_DECLINED error with redirect URL
            if (err.isInstrumentDeclined && err.redirectUrl) {
              // Payment was declined, but user can retry
              console.log('[PayNowButton] Payment declined, redirecting to retry:', err.redirectUrl);
              setApprovalUrl(err.redirectUrl);
              setPaypalModalVisible(true); // Reopen WebView with retry URL
              return; // Don't show error dialog, let user retry
            }
            
            const msg = err.message || "Failed to capture PayPal payment";
            onPaymentError?.(msg);
            Alert.alert("Payment Error", msg);
          }
        }}
        onCancel={() => {
          setPaypalModalVisible(false);
          onPaymentError?.("Payment cancelled by user");
        }}
        onError={(err) => {
          setPaypalModalVisible(false);
          onPaymentError?.(err);
          Alert.alert("Payment Error", err);
        }}
      />
    </>
  );
}
