#!/bin/bash

# Debug script for E-Tanzeem Diary App
echo "🐛 Starting E-Tanzeem Diary App with debugging enabled..."

# Set debug environment variables
export EXPO_DEBUG=true
export REACT_NATIVE_DEBUG=true
export DEBUG=*

# Check if we're on macOS for iOS debugging
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 macOS detected - iOS debugging available"
    
    # Check if iOS Simulator is available
    if xcrun simctl list devices | grep -q "iPhone"; then
        echo "📱 iOS Simulator available"
    else
        echo "⚠️  iOS Simulator not found. Install Xcode to enable iOS debugging."
    fi
fi

# Check if Android debugging is available
if command -v adb &> /dev/null; then
    echo "🤖 Android debugging available"
else
    echo "⚠️  Android debugging not available. Install Android SDK to enable Android debugging."
fi

echo ""
echo "🚀 Starting Expo development server..."
echo "📋 Available debugging methods:"
echo "   1. Chrome DevTools: Open chrome://inspect"
echo "   2. React Native Debugger: Install with 'brew install --cask react-native-debugger'"
echo "   3. VS Code: Use the launch configuration in .vscode/launch.json"
echo "   4. Flipper: Install with 'brew install --cask flipper'"
echo ""
echo "🔍 Debug breakpoints are set at:"
echo "   - LoginScreen.tsx:67 (authentication redirect)"
echo "   - LoginScreen.tsx:89 (login button press)"
echo ""
echo "📖 See DEBUGGING.md for detailed instructions"
echo ""

# Start the Expo development server
npm start 