const { withAndroidManifest } = require('@expo/config-plugins');

const withMsalActivity = (config) => {
  return withAndroidManifest(config, async (config) => {
    console.log('[withMsalActivity] Starting execution...');
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];
    const activityName = 'com.microsoft.identity.client.BrowserTabActivity';

    // Remove existing
    if (mainApplication.activity) {
      mainApplication.activity = mainApplication.activity.filter((activity) => activity.$['android:name'] !== activityName);
    } else {
        mainApplication.activity = [];
    }

    // Add new activity
    // Clean, direct injection without hacks
    mainApplication.activity.push({
      $: { 'android:name': activityName },
      'intent-filter': [
        {
          action: [ { $: { 'android:name': 'android.intent.action.VIEW' } } ],
          category: [
            { $: { 'android:name': 'android.intent.category.DEFAULT' } },
            { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
          ],
          data: [{
            $: {
                'android:host': 'com.protocolsync.portalmobile',
                'android:path': '/Xo8WBi6jzSxKDVR4drqm84yr9iU=',
                'android:scheme': 'msauth',
            }
          }],
        },
      ],
    });

    return config;
  });
};

module.exports = withMsalActivity;
