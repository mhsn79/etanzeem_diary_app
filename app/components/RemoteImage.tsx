import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Image,
  ImageStyle,
  ImageResizeMode,
  ImageSourcePropType,
} from 'react-native';
import { COLORS } from '../constants/theme';

// Define our component props
interface RemoteImageProps {
  source: ImageSourcePropType;
  fallbackSource: ImageSourcePropType;
  showLoadingIndicator?: boolean;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  onLoad?: () => void;
  onError?: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  tintColor?: string;
}

const RemoteImage: React.FC<RemoteImageProps> = ({
  source,
  fallbackSource,
  style,
  containerStyle,
  showLoadingIndicator = true,
  resizeMode = 'cover',
  onLoad,
  onError,
  onLoadStart,
  onLoadEnd,
  tintColor,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSourcePropType>(source);

  // Check if the source is a remote URI
  const isRemoteImage =
    source !== null &&
    typeof source === 'object' &&
    !Array.isArray(source) &&
    'uri' in source &&
    typeof (source as { uri?: string }).uri === 'string';

  useEffect(() => {
    // Reset states when source changes
    setIsLoading(isRemoteImage);
    setHasError(false);
    setImageSource(source);
  }, [source, isRemoteImage]);

  // Prefetch remote images to improve perceived load time
  useEffect(() => {
    if (isRemoteImage) {
      const uri = (source as { uri: string }).uri;
      console.log('Attempting to prefetch image:', uri);
      Image.prefetch(uri).catch((error) => {
        console.warn('Image prefetch failed:', error);
      });
    }
  }, [source, isRemoteImage]);

  const handleLoadStart = () => {
    console.log('Image loading started');
    isRemoteImage && setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoad = () => {
    console.log('Image loaded successfully');
    setIsLoading(false);
    onLoad?.();
  };

  const handleLoadEnd = () => {
    console.log('Image loading ended');
    setIsLoading(false);
    onLoadEnd?.();
  };

  const handleError = () => {
    console.error('Failed to load image:', isRemoteImage ? (source as { uri: string }).uri : 'local image');
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {isLoading && showLoadingIndicator && (
        <View style={[styles.loadingContainer, { width: '100%', height: '100%' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      
      <Image
        source={hasError ? fallbackSource : imageSource}
        style={style}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        tintColor={tintColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 200, 200, 0.5)',
    zIndex: 1,
  },
});

export default RemoteImage;