import { Stack } from 'expo-router';
import { AppProvider } from '../src/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#111' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="index" options={{ title: 'Janky Shop' }} />
        <Stack.Screen name="detail/[id]" options={{ title: 'Product' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </AppProvider>
  );
}
