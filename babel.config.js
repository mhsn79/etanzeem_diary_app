module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved the worklets babel plugin into react-native-worklets.
    // Must remain the last plugin.
    plugins: ['react-native-worklets/plugin'],
  };
};
