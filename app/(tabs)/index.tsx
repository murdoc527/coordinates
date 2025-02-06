import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { toDDM, toDMS, toBNG } from '@/utils/coordinateConverters';

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}

export default function HomeScreen() {
  const [location, setLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    accuracy: null,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bngCoords, setBngCoords] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Watch position with updates every second
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every second
          distanceInterval: 0, // Update regardless of distance moved
        },
        (currentLocation) => {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy,
          });
        }
      );

      // Cleanup subscription on unmount
      return () => {
        locationSubscription.remove();
      };
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });
      
      // Convert to BNG with logging
      if (location?.coords) {
        console.log('Converting to BNG:', {
          lat: location.coords.latitude,
          lon: location.coords.longitude
        });
        const bng = toBNG(location.coords.latitude, location.coords.longitude);
        console.log('BNG result:', bng);
        setBngCoords(bng || 'Outside UK');
      }
    })();
  }, []);

  useEffect(() => {
    if (location.latitude && location.longitude) {
      console.log('Converting to BNG:', {
        lat: location.latitude,
        lon: location.longitude
      });
      const bng = toBNG(location.latitude, location.longitude);
      console.log('BNG result:', bng);
      setBngCoords(bng || 'Outside UK Coverage');

      // Add debug logging
      if (!bng) {
        console.log('Location appears to be outside UK:', {
          latitude: location.latitude,
          longitude: location.longitude
        });
      }
    }
  }, [location.latitude, location.longitude]);

  const renderCoordinates = () => {
    if (!location.latitude || !location.longitude) return null;

    const latDDM = toDDM(location.latitude, true);
    const lonDDM = toDDM(location.longitude, false);

    return (
      <>
        <View style={styles.coordinateBox}>
          <ThemedText type="subtitle">Decimal Degrees (DD)</ThemedText>
          <ThemedText>
            Lat: {location.latitude.toFixed(6)}
          </ThemedText>
          <ThemedText>
            Long: {location.longitude.toFixed(6)}
          </ThemedText>
        </View>

        <View style={styles.coordinateBox}>
          <ThemedText type="subtitle">Degrees Decimal Minutes (DDM)</ThemedText>
          <ThemedText>
            Lat: {`${latDDM.degrees}° ${latDDM.minutes}.${latDDM.decimal.toString().padStart(3, '0')}' ${latDDM.direction}`}
          </ThemedText>
          <ThemedText>
            Long: {`${lonDDM.degrees}° ${lonDDM.minutes}.${lonDDM.decimal.toString().padStart(3, '0')}' ${lonDDM.direction}`}
          </ThemedText>
        </View>

        <View style={styles.coordinateBox}>
          <ThemedText type="subtitle">Degrees Minutes Seconds (DMS)</ThemedText>
          <ThemedText>
            Lat: {toDMS(location.latitude, true)}
          </ThemedText>
          <ThemedText>
            Long: {toDMS(location.longitude, false)}
          </ThemedText>
        </View>

        <View style={styles.coordinateBox}>
          <ThemedText type="subtitle">British National Grid</ThemedText>
          {bngCoords ? (
            <ThemedText>{bngCoords}</ThemedText>
          ) : (
            <ThemedText>Calculating...</ThemedText>
          )}
        </View>
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title">Current Position</ThemedText>
        
        {errorMsg ? (
          <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
        ) : (
          <>
            {renderCoordinates()}
            <View style={styles.accuracyContainer}>
              <ThemedText type="defaultSemiBold">
                Accuracy: {location.accuracy ? `±${location.accuracy.toFixed(0)}m` : 'Calculating...'}
              </ThemedText>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    gap: 20,
  },
  coordinateBox: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#25292e20',
    alignItems: 'center',
    gap: 10,
  },
  accuracyContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
  },
}); 