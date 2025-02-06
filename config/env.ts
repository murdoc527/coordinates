import Constants from "expo-constants";

export const ENV = {
  dev: {
    apiUrl: "http://localhost:3000",
  },
  prod: {
    apiUrl: "https://api.yourapp.com",
  },
}[Constants.expoConfig?.extra?.releaseChannel === "prod" ? "prod" : "dev"];
