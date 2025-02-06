// Add AsyncStorage for offline data
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Use AsyncStorage for web, SecureStore for native
const storage = {
  async setItem(key: string, value: string) {
    if (isWeb) {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string) {
    if (isWeb) {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async removeItem(key: string) {
    if (isWeb) {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  }
};

export async function saveToStorage<T>(
  key: string, 
  value: T, 
  schema?: z.ZodSchema<T>
): Promise<void> {
  try {
    if (schema) {
      schema.parse(value);
    }
    const jsonValue = JSON.stringify(value);
    await storage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error saving to storage:', error);
    throw error;
  }
}

export async function getFromStorage<T>(
  key: string, 
  schema?: z.ZodSchema<T>
): Promise<T | null> {
  try {
    const jsonValue = await storage.getItem(key);
    if (!jsonValue) return null;
    
    const parsed = JSON.parse(jsonValue);
    if (schema) {
      return schema.parse(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('Error reading from storage:', error);
    return null;
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    await storage.removeItem(key);
  } catch (error) {
    console.error('Error removing from storage:', error);
    throw error;
  }
} 