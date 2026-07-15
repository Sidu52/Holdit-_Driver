import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { THEME } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface PhotoCaptureProps {
  maxPhotos?: number;
  onPhotosChange: (photos: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const PhotoCapture = ({ 
  maxPhotos = 5, 
  onPhotosChange,
  title = "Capture Photos",
  subtitle = `Add up to ${maxPhotos} photos`
}: PhotoCaptureProps) => {
  const [photos, setPhotos] = useState<string[]>([]);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return false;
    }
    return true;
  };

  const handleTakePicture = async () => {
    if (photos.length >= maxPhotos) return;
    
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // compress to save bandwidth
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = [...photos, result.assets[0].uri];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle} ({photos.length}/{maxPhotos})</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
        {photos.map((uri, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity 
              style={styles.removeBtn} 
              onPress={() => handleRemovePhoto(index)}
            >
              <Ionicons name="close-circle" size={24} color={THEME.ERROR} />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < maxPhotos && (
          <TouchableOpacity style={styles.addBtn} onPress={handleTakePicture}>
            <Ionicons name="camera-outline" size={32} color={THEME.PRIMARY} />
            <Text style={styles.addBtnText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.TEXT_DARK,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
  },
  scrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: THEME.BACKGROUND_SECONDARY,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.PRIMARY_LIGHT,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20, // Add padding at the end of scroll
  },
  addBtnText: {
    marginTop: 4,
    fontSize: 12,
    color: THEME.PRIMARY,
    fontWeight: '600',
  }
});
