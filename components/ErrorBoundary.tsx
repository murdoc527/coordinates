import { ErrorBoundary } from "react-error-boundary";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <View
      style={
        StyleSheet.create({
          container: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          },
        }).container
      }
    >
      <ThemedText>Something went wrong:</ThemedText>
      <ThemedText>{error.message}</ThemedText>
      <TouchableOpacity onPress={resetErrorBoundary}>
        <ThemedText>Try again</ThemedText>
      </TouchableOpacity>
    </View>
  );
}
