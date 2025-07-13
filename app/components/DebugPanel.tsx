import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { COLORS } from '../constants/theme';
import { debugLog } from '../utils/debug';

interface DebugPanelProps {
  visible?: boolean;
  onToggle?: () => void;
}

export default function DebugPanel({ visible = false, onToggle }: DebugPanelProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Get various app states for debugging
  const auth = useAppSelector(state => state.auth);
  const activities = useAppSelector(state => state.activities);
  const persons = useAppSelector(state => state.persons);
  const reportsNew = useAppSelector(state => state.reportsNew);
  const tanzeem = useAppSelector(state => state.tanzeem);

  // Only show debug panel in development
  if (!__DEV__ || !visible) return null;

  const debugInfo = {
    auth: {
      isAuthenticated: !!auth.tokens,
      status: auth.status,
      error: auth.error,
      user: auth.user ? 'User loaded' : 'No user'
    },
    activities: {
      count: activities.ids?.length || 0,
      status: activities.status
    },
    persons: {
      count: persons.ids?.length || 0,
      status: persons.status
    },
    reports: {
      count: Object.keys(reportsNew.reports).length,
      status: reportsNew.loading ? 'loading' : 'idle',
      submissions: reportsNew.reportSubmissions.length
    },
    tanzeem: {
      count: tanzeem.ids?.length || 0,
      status: tanzeem.status
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.headerText}>🐛 Debug Panel</Text>
        <Text style={styles.toggleText}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      
      {expanded && (
        <ScrollView style={styles.content}>
          {Object.entries(debugInfo).map(([key, value]) => (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{key.toUpperCase()}</Text>
              {Object.entries(value).map(([subKey, subValue]) => (
                <Text key={subKey} style={styles.debugText}>
                  {subKey}: {String(subValue)}
                </Text>
              ))}
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              debugLog('Current app state:', debugInfo);
              debugLog('Full Redux state:', { auth, activities, persons, reportsNew, tanzeem });
            }}
          >
            <Text style={styles.buttonText}>Log State to Console</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    maxWidth: 300,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleText: {
    color: 'white',
    fontSize: 12,
  },
  content: {
    maxHeight: 400,
    padding: 10,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
}); 