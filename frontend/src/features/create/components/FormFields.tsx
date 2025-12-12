import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              selectedCategory === cat.id && styles.categoryButtonSelected
            ]}
            onPress={() => onSelectCategory(cat.id)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === cat.id && styles.categoryButtonTextSelected
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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Condition</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {conditions.map(cond => (
          <TouchableOpacity
            key={cond}
            style={[
              styles.conditionButton,
              selectedCondition === cond && styles.conditionButtonSelected
            ]}
            onPress={() => onSelectCondition(cond)}
          >
            <Text style={[
              styles.conditionButtonText,
              selectedCondition === cond && styles.conditionButtonTextSelected
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
    color: '#1a1a1a',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  conditionButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  conditionButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  conditionButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  conditionButtonTextSelected: {
    color: '#ffffff',
  },
});
