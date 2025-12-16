import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/GlobalThemeComponents';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
}

export function FormField({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  maxLength 
}: FormFieldProps) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.section}>
      <ThemedText type="body" style={styles.sectionTitle}>{label}</ThemedText>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.primary }
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.secondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        autoFocus={false}
        selectTextOnFocus={true}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number) => void;
}

export function CategorySelector({ categories, selectedCategory, onSelectCategory }: CategorySelectorProps) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.section}>
      <ThemedText type="body" style={styles.sectionTitle}>Category</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              selectedCategory === cat.id && [styles.categoryButtonSelected, { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }],
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
            onPress={() => onSelectCategory(cat.id)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === cat.id && styles.categoryButtonTextSelected,
              { color: selectedCategory === cat.id ? '#FFFFFF' : theme.colors.secondary }
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

interface ConditionSelectorProps {
  conditions: string[];
  selectedCondition: string;
  onSelectCondition: (condition: string) => void;
}

export function ConditionSelector({ conditions, selectedCondition, onSelectCondition }: ConditionSelectorProps) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.section}>
      <ThemedText type="body" style={styles.sectionTitle}>Condition</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {conditions.map(cond => (
          <TouchableOpacity
            key={cond}
            style={[
              styles.conditionButton,
              selectedCondition === cond && [styles.conditionButtonSelected, { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }],
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
            onPress={() => onSelectCondition(cond)}
          >
            <Text style={[
              styles.conditionButtonText,
              selectedCondition === cond && styles.conditionButtonTextSelected,
              { color: selectedCondition === cond ? '#FFFFFF' : theme.colors.secondary }
            ]}>
              {cond}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryButtonSelected: {
  },
  categoryButtonText: {
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
  },
  conditionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  conditionButtonSelected: {
  },
  conditionButtonText: {
    fontWeight: '500',
  },
  conditionButtonTextSelected: {
  },
});
