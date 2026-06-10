import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/api';

/**
 * Request camera and media library permissions
 */
export const requestMediaPermissions = async (): Promise<boolean> => {
  try {
    // Request camera permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    // Request media library permissions
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraPermission.granted && mediaLibraryPermission.granted;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

/**
 * Options for image picking
 */
export interface ImagePickOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
  includeBase64?: boolean;
}

/**
 * Pick an image from the camera
 */
export const pickImageFromCamera = async (options: ImagePickOptions = {}): Promise<ImagePicker.ImagePickerResult> => {
  const defaultOptions: ImagePickOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  };
  
  return await ImagePicker.launchCameraAsync({
    ...defaultOptions,
    ...options,
  });
};

/**
 * Pick an image from the media library
 */
export const pickImageFromLibrary = async (options: ImagePickOptions = {}): Promise<ImagePicker.ImagePickerResult> => {
  const defaultOptions: ImagePickOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  };
  
  return await ImagePicker.launchImageLibraryAsync({
    ...defaultOptions,
    ...options,
  });
};

/**
 * Show image picker with options for camera or gallery
 */
export const showImagePickerOptions = async (
  onCameraPress: () => Promise<void>,
  onGalleryPress: () => Promise<void>
): Promise<void> => {
  // This function will be implemented in the component using Alert or a custom modal
  // We'll pass the callbacks to handle camera and gallery selection
};

/**
 * Upload an image to the server
 */
export const uploadImage = async (
  uri: string, 
  token: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Get file name from URI
    const uriParts = uri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // Append file to form data
    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${fileName.split('.').pop()}`,
    } as any);
    
    // Create XMLHttpRequest to track upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
      
      // Handle response
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Return the file ID or URL from the response
            resolve(response.data?.id || '');
          } catch (error) {
            reject(new Error('Failed to parse server response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      
      // Handle errors
      xhr.onerror = () => {
        reject(new Error('Network error occurred during upload'));
      };
      
      // Open and send the request
      xhr.open('POST', `${API_BASE_URL}/files`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Get the full URL for an image from its ID
 */
export const getImageUrl = (imageId: string): string => {
  if (!imageId) return '';
  return `${API_BASE_URL}/assets/${imageId}`;
};

// Default export to prevent Expo Router from treating this as a route
export default {
  requestMediaPermissions,
  pickImageFromCamera,
  pickImageFromLibrary,
  showImagePickerOptions,
  uploadImage,
  getImageUrl
};