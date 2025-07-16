import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { selectAuthState } from '../features/auth/authSlice';
import { getBackgroundRefreshStatus, triggerBackgroundRefresh } from '../utils/tokenRefresh';
import { COLORS } from '../constants/theme';

interface DebugPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export default function DebugPanel({ isVisible = false, onToggle }: DebugPanelProps) {
  const [refreshStatus, setRefreshStatus] = useState<any>(null);
  const auth = useAppSelector(selectAuthState);
  const dispatch = useAppDispatch();

  // Update refresh status periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateStatus = () => {
      setRefreshStatus(getBackgroundRefreshStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const formatExpiry = (expiresAt: number) => {
    const timeUntil = expiresAt - Date.now();
    if (timeUntil <= 0) return 'Expired';
    return formatTime(timeUntil);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Panel</Text>
        {onToggle && (
          <TouchableOpacity onPress={onToggle} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.content}>
        {/* Authentication Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          <Text style={styles.text}>
            Status: {auth.status}
          </Text>
          <Text style={styles.text}>
            Has Tokens: {auth.tokens ? 'Yes' : 'No'}
          </Text>
          {auth.tokens && (
            <>
              <Text style={styles.text}>
                Access Token: {auth.tokens.accessToken.substring(0, 20)}...
              </Text>
              <Text style={styles.text}>
                Refresh Token: {auth.tokens.refreshToken.substring(0, 20)}...
              </Text>
              <Text style={styles.text}>
                Expires In: {formatExpiry(auth.tokens.expiresAt)}
              </Text>
            </>
          )}
        </View>

        {/* Token Refresh Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Refresh</Text>
          {refreshStatus && (
            <>
              <Text style={styles.text}>
                Background Refresh: {refreshStatus.isActive ? 'Active' : 'Inactive'}
              </Text>
              <Text style={styles.text}>
                Last Refresh: {refreshStatus.lastRefreshTime ? formatTime(Date.now() - refreshStatus.lastRefreshTime) : 'Never'}
              </Text>
              <Text style={styles.text}>
                Time Since Last: {formatTime(refreshStatus.timeSinceLastRefresh)}
              </Text>
            </>
          )}
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              if (auth.tokens) {
                triggerBackgroundRefresh(dispatch, auth.tokens);
              }
            }}
          >
            <Text style={styles.buttonText}>Trigger Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Error Status */}
        {auth.error && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Error</Text>
            <Text style={[styles.text, styles.errorText]}>{auth.error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    width: 300,
    maxHeight: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 10,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  errorText: {
    color: '#ff6b6b',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
}); 