import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { testNetworkConnectivity } from '../features/auth/authSlice';

interface NetworkTestButtonProps {
  onTestComplete?: (results: any) => void;
}

const NetworkTestButton: React.FC<NetworkTestButtonProps> = ({ onTestComplete }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runNetworkTest = async () => {
    setIsTesting(true);
    setResults(null);
    
    try {
      console.log('[DEBUG] 🧪 Starting network connectivity test...');
      
      const testResults = {
        timestamp: new Date().toISOString(),
        tests: [] as any[]
      };
      
      const tests = [
        { name: 'Google DNS (IP)', url: 'https://8.8.8.8', type: 'ip' },
        { name: 'Cloudflare DNS (IP)', url: 'https://1.1.1.1', type: 'ip' },
        { name: 'HTTPBin (DNS)', url: 'https://httpbin.org/get', type: 'dns' },
        { name: 'API Server (DNS)', url: 'https://admin.jiislamabad.org', type: 'dns' }
      ];
      
      for (const test of tests) {
        try {
          console.log(`[DEBUG] 🔍 Testing ${test.name}...`);
          const startTime = Date.now();
          const response = await fetch(test.url, { 
            method: 'GET',
            headers: {
              'User-Agent': 'E-Tanzeem-App/1.0'
            }
          });
          const endTime = Date.now();
          
          const result = {
            name: test.name,
            type: test.type,
            status: response.status,
            responseTime: endTime - startTime,
            success: true,
            error: null
          };
          
          testResults.tests.push(result);
          console.log(`[DEBUG] ✅ ${test.name} test passed - Status: ${response.status} (${result.responseTime}ms)`);
        } catch (error: any) {
          const result = {
            name: test.name,
            type: test.type,
            status: null,
            responseTime: null,
            success: false,
            error: error.message
          };
          
          testResults.tests.push(result);
          console.error(`[DEBUG] ❌ ${test.name} test failed:`, error.message);
          console.error(`[DEBUG] ❌ Error name:`, error.name);
          console.error(`[DEBUG] ❌ Error stack:`, error.stack);
        }
      }
      
      // Analyze results
      const ipTests = testResults.tests.filter(t => t.type === 'ip');
      const dnsTests = testResults.tests.filter(t => t.type === 'dns');
      
      const ipSuccess = ipTests.filter(t => t.success).length;
      const dnsSuccess = dnsTests.filter(t => t.success).length;
      
      console.log(`[DEBUG] 📊 Network Test Summary:`);
      console.log(`[DEBUG] 📊 IP connectivity: ${ipSuccess}/${ipTests.length} successful`);
      console.log(`[DEBUG] 📊 DNS resolution: ${dnsSuccess}/${dnsTests.length} successful`);
      
      if (ipSuccess > 0 && dnsSuccess === 0) {
        console.log(`[DEBUG] ⚠️  DNS resolution issue detected - IP connectivity works but DNS fails`);
        Alert.alert('Network Test Results', 'DNS resolution issue detected. IP connectivity works but DNS fails.');
      } else if (ipSuccess === 0) {
        console.log(`[DEBUG] ❌ No network connectivity detected`);
        Alert.alert('Network Test Results', 'No network connectivity detected. Please check your internet connection.');
      } else if (dnsSuccess === 0) {
        console.log(`[DEBUG] ⚠️  DNS resolution issue - try restarting emulator or check DNS settings`);
        Alert.alert('Network Test Results', 'DNS resolution issue detected. Try restarting emulator or check DNS settings.');
      } else {
        console.log(`[DEBUG] ✅ Network connectivity appears normal`);
        Alert.alert('Network Test Results', 'Network connectivity appears normal.');
      }
      
      setResults(testResults);
      if (onTestComplete) {
        onTestComplete(testResults);
      }
    } catch (error: any) {
      console.error('[DEBUG] ❌ Network test failed:', error);
      Alert.alert('Network Test Error', `Network test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, isTesting && styles.buttonDisabled]} 
        onPress={runNetworkTest}
        disabled={isTesting}
      >
        <Text style={styles.buttonText}>
          {isTesting ? 'Testing Network...' : 'Test Network'}
        </Text>
      </TouchableOpacity>
      
      {results && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {results.tests.map((test: any, index: number) => (
            <Text key={index} style={[styles.resultItem, test.success ? styles.success : styles.failure]}>
              {test.name}: {test.success ? '✅ PASS' : '❌ FAIL'} 
              {test.success && test.responseTime ? ` (${test.responseTime}ms)` : ''}
              {!test.success && test.error ? ` - ${test.error}` : ''}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultItem: {
    fontSize: 12,
    marginVertical: 2,
  },
  success: {
    color: 'green',
  },
  failure: {
    color: 'red',
  },
});

export default NetworkTestButton; 