import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <View style={styles.errorContainer}>
      <ThemedText>Something went wrong:</ThemedText>
      <ThemedText>{error.message}</ThemedText>
      <TouchableOpacity onPress={resetErrorBoundary}>
        <ThemedText>Try again</ThemedText>
      </TouchableOpacity>
    </View>
  );
} 