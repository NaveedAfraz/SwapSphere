import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Interactions } from "@/src/constants/theme";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
  isBot: boolean;
}

const botResponses = {
  greeting:
    "Hello! I'm SwapSphere's support assistant. How can I help you today?",
  help: "I can help you with:\n• Account issues\n• Buying and selling\n• Payments and refunds\n• Safety and security\n• Technical problems\nWhat do you need help with?",
  account:
    "For account issues, you can:\n• Reset your password in settings\n• Update your profile information\n• Contact our support team\nWhat specific account problem are you having?",
  buying:
    "For buying help:\n• Browse listings in categories\n• Make offers on items\n• Chat with sellers\n• Complete purchases safely\nNeed help with a specific purchase?",
  selling:
    "For selling help:\n• Create detailed listings\n• Set fair prices\n• Respond to offers\n• Ship items safely\nWhat selling question do you have?",
  payment:
    "For payment issues:\n• Check your payment methods in settings\n• Contact support for refund requests\n• Ensure your billing info is current\nWhat payment problem are you experiencing?",
  safety:
    "For safety:\n• Meet in public places for exchanges\n• Use our chat for all communication\n• Never share personal financial info\n• Report suspicious activity\nWhat safety concerns do you have?",
  fallback:
    "I understand you need help. Let me connect you with our detailed FAQ section or you can report a specific issue.",
};

export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: botResponses.greeting,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isBot: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (
      input.includes("hello") ||
      input.includes("hi") ||
      input.includes("hey")
    ) {
      return botResponses.greeting;
    } else if (input.includes("help") || input.includes("assist")) {
      return botResponses.help;
    } else if (
      input.includes("account") ||
      input.includes("profile") ||
      input.includes("password")
    ) {
      return botResponses.account;
    } else if (
      input.includes("buy") ||
      input.includes("purchase") ||
      input.includes("shop")
    ) {
      return botResponses.buying;
    } else if (
      input.includes("sell") ||
      input.includes("listing") ||
      input.includes("item")
    ) {
      return botResponses.selling;
    } else if (
      input.includes("pay") ||
      input.includes("refund") ||
      input.includes("money")
    ) {
      return botResponses.payment;
    } else if (
      input.includes("safe") ||
      input.includes("security") ||
      input.includes("scam")
    ) {
      return botResponses.safety;
    } else {
      return botResponses.fallback;
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: inputText.trim(),
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isBot: false,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setIsTyping(true);

      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: getBotResponse(inputText),
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isBot: true,
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isBot ? styles.botMessage : styles.userMessage,
      ]}
    >
      <View
        style={[
          styles.bubble,
          item.isBot ? styles.botBubble : styles.userBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isBot ? styles.botText : styles.userText,
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            item.isBot ? styles.botTimestamp : styles.userTimestamp,
          ]}
        >
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support Chat</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Online</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Bot is typing...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim()
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            activeOpacity={Interactions.buttonOpacity}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#6B7280",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  botMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  userMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 60,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#3B82F6",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  botText: {
    color: "#111827",
  },
  userText: {
    color: "#FFFFFF",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  botTimestamp: {
    color: "#9CA3AF",
    textAlign: "left",
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    fontSize: 16,
    color: "#111827",
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#3B82F6",
  },
  sendButtonInactive: {
    backgroundColor: "#F3F4F6",
  },
});
