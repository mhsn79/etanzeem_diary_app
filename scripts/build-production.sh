#!/bin/bash

# Production build script for E-Tanzeem Diary App
echo "🏗️  Building E-Tanzeem Diary App for production..."

# Set production environment variables
export NODE_ENV=production
export EXPO_DEBUG=false
export REACT_NATIVE_DEBUG=false

# Remove debug environment variables
unset DEBUG

echo "📦 Building for production..."
echo "🔒 Debug code will be automatically excluded"
echo "📱 Building for both iOS and Android..."

# Build for iOS
echo "🍎 Building iOS app..."
npx expo run:ios --configuration Release

# Build for Android
echo "🤖 Building Android app..."
npx expo run:android --variant release

echo "✅ Production build complete!"
echo "📋 Debug features removed:"
echo "   - Console.log statements"
echo "   - Debugger statements"
echo "   - Debug panel"
echo "   - Development-only features" 