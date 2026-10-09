/**
 * Ensures release / EAS builds always know the production API URL.
 * Local overrides still come from EXPO_PUBLIC_API_URL in `.env`.
 */
const appJson = require("./app.json");

const DEFAULT_API = "https://api.civicleder.in/api/v1";

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      apiUrl: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API,
    },
  },
};
