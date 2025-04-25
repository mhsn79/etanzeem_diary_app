import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import FastImage, { ImageStyle as FastImageStyle } from 'react-native-fast-image';
import { COLORS } from '../constants/theme';

// Import FastImage types
type FastImageSource = {
  uri: string;
  headers?: { [key: string]: string };
  priority?: typeof FastImage.priority[keyof typeof FastImage.priority];
  cache?: typeof FastImage.cacheControl[keyof typeof FastImage.cacheControl];
};

// Define our component props
interface RemoteImageProps {
  source: FastImageSource | number;
  fallbackSource: number;
  showLoadingIndicator?: boolean;
  style?: StyleProp<FastImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: typeof FastImage.resizeMode[keyof typeof FastImage.resizeMode];
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
  resizeMode = FastImage.resizeMode.cover,
  onLoad,
  onError,
  onLoadStart,
  onLoadEnd,
  tintColor,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSource, setImageSource] = useState<FastImageSource | number>(source);

  // Check if the source is a remote URI
  const isRemoteImage = typeof source === 'object' && 
                        source !== null && 
                        'uri' in source && 
                        typeof source.uri === 'string';

  useEffect(() => {
    // Reset states when source changes
    setIsLoading(isRemoteImage);
    setHasError(false);
    setImageSource(source);
  }, [source, isRemoteImage]);

  // Preload images using FastImage's preload method
  useEffect(() => {
    if (isRemoteImage) {
      const uri = (source as FastImageSource).uri;
      
      // Log the attempt
      console.log('Attempting to preload image:', uri);
      
      // Use FastImage.preload to preload the image
      FastImage.preload([source as FastImageSource]);
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
    console.error('Failed to load image:', isRemoteImage ? (source as FastImageSource).uri : 'local image');
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
      
      <FastImage
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