const { withProjectBuildGradle } = require('@expo/config-plugins');

const withGradleFixes = (config) => {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language === 'groovy') { 
      let buildGradle = cfg.modResults.contents;

      const customVariables = `
// [ProtocolSync] Custom Monorepo & MSAL Fixes
allprojects {
    repositories {
        maven { url "https://pkgs.dev.azure.com/MicrosoftDeviceSDK/DuoSDK-Public/_packaging/Duo-SDK-Feed/maven/v1" }
    }
    ext {
        REACT_NATIVE_NODE_MODULES_DIR = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath()
        Msal_compileSdkVersion = 36
        Msal_targetSdkVersion = 36
        Msal_minSdkVersion = 24
    }
}
`;

      if (!buildGradle.includes('Msal_compileSdkVersion')) {
          // Append to the end of the file. usage of 'allprojects' ensures it applies to submodules too.
          cfg.modResults.contents = buildGradle + '\n' + customVariables;
          console.log('[withGradleFixes] Appended custom ext variables to root build.gradle');
      }
    }
    return cfg;
  });
};

module.exports = withGradleFixes;
