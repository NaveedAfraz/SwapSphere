import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";

interface FormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "password";
}

interface ReusableAuthFormProps {
  schema: z.ZodSchema<any>;
  fields: FormField[];
  defaultValues: Record<string, string>;
  submitLabel: string;
  onSubmit: (data: any) => void;
}

export default function ReusableAuthForm({
  schema,
  fields,
  defaultValues,
  submitLabel,
  onSubmit,
}: ReusableAuthFormProps) {
  const [formData, setFormData] = React.useState(defaultValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState<
    Record<string, boolean>
  >({});

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = schema.parse(formData);
      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  return (
    <View style={styles.container}>
      {fields.map((field) => (
        <View key={field.name} style={styles.fieldContainer}>
          <Text style={styles.label}>{field.label}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                errors[field.name] && styles.inputError,
                focusedField === field.name && styles.inputFocused,
              ]}
              placeholder={field.placeholder}
              placeholderTextColor="#95a5a6"
              value={formData[field.name] || ""}
              onChangeText={(value) => handleInputChange(field.name, value)}
              secureTextEntry={
                field.type === "password" && !showPassword[field.name]
              }
              keyboardType={
                field.type === "email" ? "email-address" : "default"
              }
              autoCapitalize="none"
              editable={!isLoading}
              onFocus={() => setFocusedField(field.name)}
              onBlur={() => setFocusedField(null)}
            />
            {field.type === "password" && (
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => togglePasswordVisibility(field.name)}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword[field.name] ? "eye-off" : "eye"}
                  size={22}
                  color="#7f8c8d"
                />
              </TouchableOpacity>
            )}
          </View>
          {errors[field.name] && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#e74c3c" />
              <Text style={styles.errorText}>{errors[field.name]}</Text>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#34495e",
    letterSpacing: 0.3,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e1e8ed",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: "#2c3e50",
    minHeight: 52,
  },
  inputFocused: {
    borderColor: "#3498db",
    backgroundColor: "#ffffff",
    shadowColor: "#3498db",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputError: {
    borderColor: "#e74c3c",
    backgroundColor: "#fff5f5",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 15,
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 4,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#3498db",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#3498db",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    minHeight: 54,
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#95a5a6",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
