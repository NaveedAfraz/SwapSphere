import React, { useState, useRef } from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface PayPalWebViewProps {
  visible: boolean;
  approvalUrl: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export default function PayPalWebView({ 
  visible, 
  approvalUrl, 
  onSuccess, 
  onCancel, 
  onError 
}: PayPalWebViewProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    console.log('[PayPalWebView] Navigation state changed:', { url });
    
    // ONLY detect success when PayPal redirects to our frontend success URL
    if (url.includes('192.168.0.104:3000') && url.includes('/payments/paypal/success')) {
      console.log('[PayPalWebView] Detected PayPal success redirect:', url);
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const token = urlParams.get('token');
      const payerId = urlParams.get('PayerID');
      
      if (token) {
        // Check if this is actually a successful payment by looking for decline indicators
        if (url.includes('instrument_declined') || url.includes('declined') || url.includes('error')) {
          console.log('[PayPalWebView] Payment declined despite success redirect');
          onError('Payment method declined. Please try another funding source.');
          return;
        }
        
        onSuccess({ token, payerId });
        return; // Close WebView immediately on success
      }
    }
    
    // ONLY detect cancel when PayPal redirects to our frontend cancel URL
    if (url.includes('192.168.0.104:3000') && url.includes('/payments/paypal/cancel')) {
      console.log('[PayPalWebView] Detected PayPal cancel redirect:', url);
      onCancel();
      return; // Close WebView immediately on cancel
    }
    
    // Handle loading state
    if (url.includes('paypal.com')) {
      setLoading(false);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
    
    // Don't trigger error for timeout on success page - capture still works
    if (nativeEvent.url && nativeEvent.url.includes('/payments/paypal/success')) {
      console.log('Ignoring timeout on PayPal success page - capture should still work');
      return;
    }
    
    onError('Payment page failed to load');
  };

  const injectedJavaScript = `
    (function() {
      // Only check for redirects to our backend URLs
      function checkPayPalStatus() {
        const url = window.location.href;
        console.log('Checking PayPal status for URL:', url);
        
        // Only detect success when redirected to our frontend
        if (url.includes('192.168.0.104:3000') && url.includes('/payments/paypal/success')) {
          console.log('PayPal success redirect detected');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'success',
            url: url
          }));
        }
        // Only detect cancel when redirected to our frontend
        if (url.includes('192.168.0.104:3000') && url.includes('/payments/paypal/cancel')) {
          console.log('PayPal cancel redirect detected');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'cancel',
            url: url
          }));
        }
      }
      
      // Check status every 3 seconds
      setInterval(checkPayPalStatus, 3000);
      
      // Also check on page load
      window.addEventListener('load', checkPayPalStatus);
    })();
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'success') {
        const urlParams = new URLSearchParams(data.url.split('?')[1]);
        const token = urlParams.get('token');
        const payerId = urlParams.get('PayerID');
        
        if (token) {
          onSuccess({ token, payerId });
          return; // Close WebView immediately
        }
      } else if (data.type === 'cancel') {
        onCancel();
        return; // Close WebView immediately
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading PayPal...</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ uri: approvalUrl }}
          style={styles.webView}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  webView: {
    flex: 1,
    marginTop: 0,
  },
});
