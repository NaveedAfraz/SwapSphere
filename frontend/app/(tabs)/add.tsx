import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageGallery from '@/src/features/create/components/ImageGallery';
import { FormField, CategorySelector, ConditionSelector } from '@/src/features/create/components/FormFields';

const categories = [
  { id: 1, name: 'Fashion', icon: '', color: '#FFE66D' },
  { id: 2, name: 'Tech', icon: '', color: '#95E1D3' },
  { id: 3, name: 'Home', icon: '', color: '#F6C1C1' },
  { id: 4, name: 'Fitness', icon: '', color: '#F38181' },
];

const conditions = ['New', 'Like New', 'Good', 'Fair'];

export default function CreateScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
    // This is handled by the ImageGallery component
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addImages = (uris: string[]) => {
    setImages(prev => [...prev, ...uris]);
  };

  const handleSubmit = () => {
    if (!title || !description || !price || !category || !condition || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    Alert.alert('Success', 'Listing created successfully!');
    // Reset form
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory(null);
    setCondition('');
    setLocation('');
    setImages([]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Listing</Text>
          <TouchableOpacity style={styles.postButton} onPress={handleSubmit}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <ImageGallery 
            images={images}
            onAddImages={addImages}
            onRemoveImage={removeImage}
          />

          <FormField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="What are you selling?"
            maxLength={80}
          />

          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your item..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <FormField
            label="Price"
            value={price}
            onChangeText={setPrice}
            placeholder="$0.00"
            keyboardType="numeric"
          />

          <CategorySelector
            categories={categories}
            selectedCategory={category}
            onSelectCategory={setCategory}
          />

          <ConditionSelector
            conditions={conditions}
            selectedCondition={condition}
            onSelectCondition={setCondition}
          />

          <FormField
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="City, State"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  postButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
