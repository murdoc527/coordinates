import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Clipboard,
  Share,
  ScrollView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { fromBNG } from "@/utils/coordinateConverters";
import { FontAwesome } from "@expo/vector-icons";
import { saveToStorage, getFromStorage } from "@/utils/storage";
import {
  toDDM,
  toDMS,
  toBNG,
  calculateDistance,
} from "@/utils/coordinateConverters";
import { CoordinatesSchema, SavedLocationSchema } from "@/utils/validation";
import * as ExpoLinking from "expo-linking";
import { useColorScheme } from "@/hooks/useColorScheme";
import { z } from "zod";

interface Coordinates {
  latitude: number;
  longitude: number;
}

// Add saved locations functionality
interface SavedLocation {
  id: string;
  name: string;
  coordinates: Coordinates;
  timestamp: number;
  format: "BNG" | "DD" | "DDM" | "DMS";
  originalInput: string;
}

// Update the interface for recent searches
interface RecentSearch {
  text: string;
  timestamp: number;
}

export default function SearchScreen() {
  const [searchText, setSearchText] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<SavedLocation | null>(null);
  const [distance, setDistance] = useState<{
    meters: number;
    miles: number;
  } | null>(null);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(
    null
  );
  const [newName, setNewName] = useState("");
  const colorScheme = useColorScheme();
  const dynamicStyles = getStyles(colorScheme);

  // Load saved locations on mount
  useEffect(() => {
    (async () => {
      const saved = await getFromStorage(
        "savedLocations",
        z.array(SavedLocationSchema)
      );
      const recent = await getFromStorage(
        "recentSearches",
        z.array(
          z.object({
            text: z.string(),
            timestamp: z.number(),
          })
        )
      );
      if (saved) setSavedLocations(saved);
      if (recent) setRecentSearches(recent);

      // Handle URL parameters
      const url = await ExpoLinking.parseInitialURLAsync();
      if (url.queryParams?.q) {
        handleSearch(url.queryParams.q as string);
      }
    })();
  }, []);

  const handleSearch = async (input: string) => {
    setError(null);
    if (!input || typeof input !== "string") {
      setError("Please enter coordinates");
      return;
    }

    try {
      const coords = parseCoordinates(input);
      if (!coords) {
        setError("Invalid coordinate format");
        return;
      }

      CoordinatesSchema.parse(coords);
      setCoordinates(coords);
      addToRecent(input);
      await saveToStorage(
        "recentSearches",
        recentSearches,
        z.array(
          z.object({
            text: z.string(),
            timestamp: z.number(),
          })
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid coordinates");
    }
  };

  const parseCoordinates = (input: string) => {
    if (!input || typeof input !== "string") {
      console.log("Invalid input:", input);
      return null;
    }

    const cleaned = input.trim().toUpperCase();
    console.log("Parsing input:", cleaned);

    try {
      // Try to parse as Grid Reference with various formats
      const gridRefPattern =
        /^([A-Z]{2})\s*(\d{4,5})(?:\s*,\s*|\s+)(\d{4,5})$|^([A-Z]{2})\s*(\d{8,10})$/;
      const gridMatch = cleaned.match(gridRefPattern);

      if (gridMatch) {
        console.log("Grid reference match:", gridMatch);
        let letters, easting, northing;

        if (gridMatch[1] && gridMatch[2] && gridMatch[3]) {
          // Format: XX 12345 67890
          letters = gridMatch[1];
          easting = gridMatch[2].padEnd(5, "0");
          northing = gridMatch[3].padEnd(5, "0");
        } else {
          // Format: XX1234567890
          letters = gridMatch[4];
          const numbers = gridMatch[5];
          const mid = Math.floor(numbers.length / 2);
          easting = numbers.slice(0, mid).padEnd(5, "0");
          northing = numbers.slice(mid).padEnd(5, "0");
        }

        const bngInput = `${letters} ${easting} ${northing}`;
        console.log("Formatted BNG input:", bngInput);

        const coords = fromBNG(bngInput);
        if (coords) {
          console.log("Converted coordinates:", coords);
          return coords;
        } else {
          console.log("BNG conversion failed");
          throw new Error("Invalid grid reference - outside UK coverage");
        }
      }

      // Try to parse as DD (e.g., "50.123456, -5.123456")
      const ddPattern = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
      const ddMatch = cleaned.match(ddPattern);
      if (ddMatch) {
        const lat = parseFloat(ddMatch[1]);
        const lon = parseFloat(ddMatch[2]);

        // Basic validation of coordinates
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          throw new Error("Coordinates out of valid range");
        }

        console.log("Matched decimal degrees:", { lat, lon });
        return {
          latitude: lat,
          longitude: lon,
        };
      }

      // Try to parse as DDM (e.g., "50 45.123N, 4 30.123W")
      const ddmPattern =
        /^(\d+)\s+(\d+\.?\d*)[NS][,\s]+(\d+)\s+(\d+\.?\d*)[EW]$/;
      const ddmMatch = cleaned.match(ddmPattern);
      if (ddmMatch) {
        const [_, latDeg, latMin, lonDeg, lonMin] = ddmMatch;
        const lat = parseInt(latDeg) + parseFloat(latMin) / 60;
        const lon = parseInt(lonDeg) + parseFloat(lonMin) / 60;

        console.log("Matched degrees decimal minutes:", { lat, lon });
        return {
          latitude: cleaned.includes("S") ? -lat : lat,
          longitude: cleaned.includes("W") ? -lon : lon,
        };
      }

      // Try to parse as DMS (e.g., "50° 45' 12.3"N, 4° 30' 23.3"W")
      const dmsPattern =
        /^(\d+)°\s*(\d+)'\s*(\d+\.?\d*)\"?[NS][,\s]+(\d+)°\s*(\d+)'\s*(\d+\.?\d*)\"?[EW]$/;
      const dmsMatch = cleaned.match(dmsPattern);
      if (dmsMatch) {
        const [_, latDeg, latMin, latSec, lonDeg, lonMin, lonSec] = dmsMatch;
        const lat =
          parseInt(latDeg) + parseInt(latMin) / 60 + parseFloat(latSec) / 3600;
        const lon =
          parseInt(lonDeg) + parseInt(lonMin) / 60 + parseFloat(lonSec) / 3600;

        console.log("Matched degrees minutes seconds:", { lat, lon });
        return {
          latitude: cleaned.includes("S") ? -lat : lat,
          longitude: cleaned.includes("W") ? -lon : lon,
        };
      }

      throw new Error(
        "Could not parse coordinates. Please use one of these formats:\n" +
          '- Grid Reference (e.g., "SX 41815 48338")\n' +
          '- Decimal Degrees (e.g., "50.313611, -4.223056")\n' +
          '- Degrees Decimal Minutes (e.g., "50 18.817N, 4 13.383W")\n' +
          '- Degrees Minutes Seconds (e.g., "50° 18\' 49"N, 4° 13\' 23"W")'
      );
    } catch (err) {
      console.error("Error parsing coordinates:", err);
      throw err;
    }
  };

  const openInMaps = () => {
    if (!coordinates) return;

    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;

    if (Platform.OS === "web") {
      // Open in new tab for web platform
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // Use ExpoLinking for mobile platforms
      ExpoLinking.canOpenURL(url).then((supported) => {
        if (supported) {
          ExpoLinking.openURL(url);
        } else {
          setError("Couldn't open maps");
        }
      });
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    // Show temporary success message
    setMessage("Copied to clipboard");
    setTimeout(() => setMessage(null), 2000);
  };

  const shareLocation = async () => {
    if (!coordinates) return;

    try {
      await Share.share({
        message: `Location: ${coordinates.latitude}, ${coordinates.longitude}`,
        url: `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`,
      });
    } catch (error) {
      setError("Failed to share location");
    }
  };

  const addToRecent = (search: string) => {
    setRecentSearches((prev) => {
      const newSearch = {
        text: search,
        timestamp: Date.now(),
      };
      const filtered = prev.filter((s) => s.text !== search);
      const newSearches = [newSearch, ...filtered];
      return newSearches.slice(0, 5); // Keep last 5 searches
    });
  };

  const saveLocation = async () => {
    if (!coordinates) return;

    const newLocation: SavedLocation = {
      id: Date.now().toString(),
      name: `Location ${savedLocations.length + 1}`,
      coordinates,
      timestamp: Date.now(),
      format: "DD",
      originalInput: searchText,
    };

    const updatedLocations = [newLocation, ...savedLocations];
    setSavedLocations(updatedLocations);
    await saveToStorage(
      "savedLocations",
      updatedLocations,
      z.array(SavedLocationSchema)
    );
    setMessage("Location saved");
    setTimeout(() => setMessage(null), 2000);
  };

  // Add distance calculation
  const calculateDistanceToSelected = () => {
    if (!coordinates || !selectedLocation) return;
    const dist = calculateDistance(coordinates, selectedLocation.coordinates);
    setDistance(dist);
  };

  // Add delete function
  const deleteLocation = async (id: string) => {
    const updatedLocations = savedLocations.filter((loc) => loc.id !== id);
    setSavedLocations(updatedLocations);
    await saveToStorage(
      "savedLocations",
      updatedLocations,
      z.array(SavedLocationSchema)
    );
    setMessage("Location deleted");
    setTimeout(() => setMessage(null), 2000);
  };

  // Add rename function
  const renameLocation = async (id: string, newName: string) => {
    const updatedLocations = savedLocations.map((loc) =>
      loc.id === id ? { ...loc, name: newName } : loc
    );
    setSavedLocations(updatedLocations);
    await saveToStorage(
      "savedLocations",
      updatedLocations,
      z.array(SavedLocationSchema)
    );
    setEditingLocation(null);
    setNewName("");
    setMessage("Location renamed");
    setTimeout(() => setMessage(null), 2000);
  };

  // Add delete function
  const deleteRecentSearch = (index: number) => {
    setRecentSearches((prev) => {
      const updatedSearches = prev.filter((_, i) => i !== index);
      saveToStorage(
        "recentSearches",
        updatedSearches,
        z.array(
          z.object({
            text: z.string(),
            timestamp: z.number(),
          })
        )
      );
      return updatedSearches;
    });
  };

  // Update the saved locations section in the render
  const renderSavedLocation = (location: SavedLocation) => (
    <View key={location.id} style={styles.savedItem}>
      {editingLocation?.id === location.id ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="New name"
            autoFocus
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => renameLocation(location.id, newName)}
          >
            <FontAwesome name="check" size={16} color="#34C759" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.savedLocationContent}>
            <ThemedText style={styles.savedLocationTitle}>
              {location.name}
            </ThemedText>
            <ThemedText style={styles.savedLocationSubtitle}>
              {location.originalInput}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setEditingLocation(location);
              setNewName(location.name);
            }}
          >
            <FontAwesome name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteLocation(location.id)}
          >
            <FontAwesome name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
          <ThemedText style={styles.timestamp}>
            {new Date(location.timestamp).toLocaleDateString()}
          </ThemedText>
        </>
      )}
    </View>
  );

  // Add these styles
  const additionalStyles = StyleSheet.create({
    editContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 10,
    },
    editInput: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 5,
      paddingHorizontal: 10,
      backgroundColor: colorScheme === "dark" ? "#25292e" : "#fff",
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
    editButton: {
      padding: 10,
    },
    locationButton: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 10,
    },
    locationInfo: {
      flex: 1,
    },
    locationName: {
      fontWeight: "bold",
    },
    originalInput: {
      fontSize: 12,
      color: "#666",
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      marginTop: 15,
      backgroundColor: colorScheme === "dark" ? "#25292e" : "#f5f5f5",
      padding: 10,
      borderRadius: 8,
      gap: 20,
    },
  });

  // Merge the styles
  const styles = StyleSheet.create({
    ...dynamicStyles,
    ...additionalStyles,
    resultContainer: {
      gap: 10,
      marginTop: 10,
    },
    coordinateBox: {
      padding: 15,
      backgroundColor: "#25292e20",
      borderRadius: 10,
      alignItems: "center",
      gap: 5,
      width: "74%",
      alignSelf: "center",
    },
    coordinateTitle: {
      fontSize: 16,
      fontWeight: "bold",
    },
    coordinateText: {
      fontSize: 14,
    },
    recentContainer: {
      marginTop: 20,
      gap: 10,
    },
    recentItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderRadius: 5,
      gap: 10,
      width: "74%",
      alignSelf: "center",
    },
    recentItemContent: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    recentItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    recentTimestamp: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#9BA1A6" : "#666",
    },
    savedContainer: {
      marginTop: 20,
      gap: 10,
      alignItems: "center",
    },
    savedItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: colorScheme === "dark" ? "#25292e" : "#f0f0f0",
      borderRadius: 8,
      gap: 12,
      width: "74%",
    },
    savedLocationTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#fff" : "#11181C",
      flex: 1,
    },
    savedLocationSubtitle: {
      fontSize: 13,
      color: colorScheme === "dark" ? "#9BA1A6" : "#687076",
      marginTop: 2,
    },
    savedLocationContent: {
      flex: 1,
      gap: 2,
    },
    timestamp: {
      fontSize: 12,
      color: "#666",
      marginLeft: "auto",
    },
    messageText: {
      color: "#34C759",
      textAlign: "center",
      marginBottom: 10,
    },
    distanceContainer: {
      marginTop: 10,
      padding: 10,
      backgroundColor: "#25292e20",
      borderRadius: 5,
    },
    mapButton: {
      backgroundColor: "#34C759",
      marginLeft: "auto",
      paddingHorizontal: 15,
      paddingVertical: 8,
    },
    mapButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    mapButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "500",
    },
    searchContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      gap: 10,
    },
    searchInputContainer: {
      position: "relative",
      width: "74%",
      alignSelf: "center",
    },
    input: {
      height: 40,
      width: "70%",
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#333" : "#ccc",
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: colorScheme === "dark" ? "#25292e" : "#fff",
      color: colorScheme === "dark" ? "#fff" : "#000",
      textAlign: "center",
    },
    searchButton: {
      padding: 10,
      backgroundColor: "#007AFF",
      borderRadius: 5,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
    },
    actionButton: {
      padding: 8,
      borderRadius: 5,
      marginLeft: 10,
    },
    deleteButton: {
      padding: 8,
      borderRadius: 5,
      marginLeft: 10,
    },
    clearButton: {
      position: "absolute",
      right: 10,
      top: 10,
      padding: 4,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={[
                styles.editInput,
                { color: colorScheme === "dark" ? "#fff" : "#000" },
              ]}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Enter coordinates..."
              placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchText("")}
              >
                <FontAwesome
                  name="times-circle"
                  size={18}
                  color={colorScheme === "dark" ? "#8E8E93" : "#666"}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleSearch(searchText)}
          >
            <FontAwesome name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {message && (
          <ThemedText style={styles.messageText}>{message}</ThemedText>
        )}

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

        {coordinates && (
          <View style={styles.resultContainer}>
            <View style={styles.coordinateBox}>
              <ThemedText style={styles.coordinateTitle}>
                My Location
              </ThemedText>
              <ThemedText style={styles.coordinateText}>
                Latitude: {coordinates.latitude.toFixed(6)}
              </ThemedText>
              <ThemedText style={styles.coordinateText}>
                Longitude: {coordinates.longitude.toFixed(6)}
              </ThemedText>
            </View>

            <View style={styles.coordinateBox}>
              <ThemedText style={styles.coordinateTitle}>
                Decimal Degrees (DD)
              </ThemedText>
              <ThemedText style={styles.coordinateText}>
                Lat: {coordinates.latitude.toFixed(6)}°
              </ThemedText>
              <ThemedText style={styles.coordinateText}>
                Long: {coordinates.longitude.toFixed(6)}°
              </ThemedText>
            </View>

            <View style={styles.coordinateBox}>
              <ThemedText style={styles.coordinateTitle}>
                Degrees Decimal Minutes (DDM)
              </ThemedText>
              <ThemedText style={styles.coordinateText}>
                Lat: {toDDM(coordinates.latitude, true).degrees}°{" "}
                {toDDM(coordinates.latitude, true).minutes}.
                {toDDM(coordinates.latitude, true).decimal}
                {toDDM(coordinates.latitude, true).direction}
              </ThemedText>
              <ThemedText style={styles.coordinateText}>
                Long: {toDDM(coordinates.longitude, false).degrees}°{" "}
                {toDDM(coordinates.longitude, false).minutes}.
                {toDDM(coordinates.longitude, false).decimal}
                {toDDM(coordinates.longitude, false).direction}
              </ThemedText>
            </View>

            <View style={styles.coordinateBox}>
              <ThemedText style={styles.coordinateTitle}>
                Degrees Minutes Seconds (DMS)
              </ThemedText>
              <ThemedText style={styles.coordinateText}>
                Lat: {toDMS(coordinates.latitude, true)}
              </ThemedText>
              <ThemedText style={styles.coordinateText}>
                Long: {toDMS(coordinates.longitude, false)}
              </ThemedText>
            </View>

            <View style={styles.coordinateBox}>
              <ThemedText type="subtitle">British National Grid</ThemedText>
              <ThemedText>
                {toBNG(coordinates.latitude, coordinates.longitude) ||
                  "Outside UK"}
              </ThemedText>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  copyToClipboard(
                    `${coordinates.latitude}, ${coordinates.longitude}`
                  )
                }
              >
                <FontAwesome
                  name="copy"
                  size={18}
                  color={colorScheme === "dark" ? "#9BA1A6" : "#666"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={shareLocation}
              >
                <FontAwesome
                  name="share-alt"
                  size={18}
                  color={colorScheme === "dark" ? "#9BA1A6" : "#666"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={saveLocation}
              >
                <FontAwesome
                  name="bookmark"
                  size={18}
                  color={colorScheme === "dark" ? "#9BA1A6" : "#666"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.mapButton]}
                onPress={openInMaps}
              >
                <View style={styles.mapButtonContent}>
                  <FontAwesome name="map-marker" size={18} color="#fff" />
                  <ThemedText style={styles.mapButtonText}>
                    Open in Maps
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {recentSearches.length > 0 && (
          <View style={styles.recentContainer}>
            <ThemedText type="subtitle">Recent Searches</ThemedText>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.recentItem,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#25292e" : "#f0f0f0",
                  },
                ]}
                onPress={() => {
                  setSearchText(search.text);
                  handleSearch(search.text);
                }}
              >
                <View style={styles.recentItemContent}>
                  <View style={styles.recentItemLeft}>
                    <FontAwesome
                      name="history"
                      size={16}
                      color={colorScheme === "dark" ? "#9BA1A6" : "#666"}
                    />
                    <ThemedText>{search.text}</ThemedText>
                  </View>
                  <ThemedText style={styles.recentTimestamp}>
                    {new Date(search.timestamp).toLocaleString()}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteRecentSearch(index)}
                  >
                    <FontAwesome name="trash" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {savedLocations.length > 0 && (
          <View style={styles.savedContainer}>
            <ThemedText
              type="subtitle"
              style={{ fontSize: 18, fontWeight: "600" }}
            >
              Saved Locations
            </ThemedText>
            {savedLocations.map((location) => (
              <View key={location.id} style={styles.savedItem}>
                <View style={styles.savedLocationContent}>
                  <ThemedText style={styles.savedLocationTitle}>
                    {location.name}
                  </ThemedText>
                  <ThemedText style={styles.savedLocationSubtitle}>
                    {location.originalInput}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setEditingLocation(location);
                    setNewName(location.name);
                  }}
                >
                  <FontAwesome name="pencil" size={16} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteLocation(location.id)}
                >
                  <FontAwesome name="trash" size={16} color="#FF3B30" />
                </TouchableOpacity>
                <ThemedText style={styles.timestamp}>
                  {new Date(location.timestamp).toLocaleDateString()}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {selectedLocation && (
          <View style={styles.distanceContainer}>
            <ThemedText>Distance to selected location:</ThemedText>
            <ThemedText>{distance?.meters.toFixed(2)} meters</ThemedText>
            <ThemedText>{distance?.miles.toFixed(2)} miles</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const getStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    scrollContainer: {
      flexGrow: 1,
      gap: 20,
    },
    searchContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      gap: 10,
    },
    input: {
      height: 40,
      width: "70%",
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#333" : "#ccc",
      borderRadius: 8,
      paddingHorizontal: 15,
      backgroundColor: colorScheme === "dark" ? "#25292e" : "#fff",
      color: colorScheme === "dark" ? "#fff" : "#000",
      textAlign: "center",
    },
    searchButton: {
      padding: 10,
      backgroundColor: "#007AFF",
      borderRadius: 5,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
    },
    errorText: {
      color: "#ff0000",
      marginBottom: 10,
      fontWeight: "bold",
      textAlign: "center",
    },
    resultContainer: {
      gap: 10,
      marginTop: 10,
    },
    coordinateBox: {
      padding: 15,
      backgroundColor: "#25292e20",
      borderRadius: 10,
      alignItems: "center",
      gap: 5,
      width: "74%",
      alignSelf: "center",
    },
    coordinateTitle: {
      fontSize: 16,
      fontWeight: "bold",
    },
    coordinateText: {
      fontSize: 14,
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      marginTop: 15,
      backgroundColor: colorScheme === "dark" ? "#25292e" : "#f5f5f5",
      padding: 10,
      borderRadius: 8,
      gap: 20,
    },
    actionButton: {
      padding: 8,
      borderRadius: 5,
      marginLeft: 10,
    },
    mapButton: {
      backgroundColor: "#34C759",
      marginLeft: "auto",
      paddingHorizontal: 15,
      paddingVertical: 8,
    },
    mapButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    mapButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "500",
    },
    recentContainer: {
      marginTop: 20,
      gap: 10,
    },
    recentItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderRadius: 5,
      gap: 10,
      width: "74%",
      alignSelf: "center",
    },
    savedContainer: {
      marginTop: 20,
      gap: 10,
      alignItems: "center",
    },
    savedItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: colorScheme === "dark" ? "#25292e" : "#f0f0f0",
      borderRadius: 8,
      gap: 12,
      width: "74%",
    },
    savedLocationTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#fff" : "#11181C",
      flex: 1,
    },
    savedLocationSubtitle: {
      fontSize: 13,
      color: colorScheme === "dark" ? "#9BA1A6" : "#687076",
      marginTop: 2,
    },
    savedLocationContent: {
      flex: 1,
      gap: 2,
    },
    timestamp: {
      fontSize: 12,
      color: "#666",
      marginLeft: "auto",
    },
    messageText: {
      color: "#34C759",
      textAlign: "center",
      marginBottom: 10,
    },
    distanceContainer: {
      marginTop: 10,
      padding: 10,
      backgroundColor: "#25292e20",
      borderRadius: 5,
    },
    deleteButton: {
      padding: 8,
      marginLeft: 10,
    },
  });
