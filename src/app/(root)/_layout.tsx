import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    // <Stack>
    //   {/* Hide header for your main authentication/tab group */}
    //   <Stack.Screen name="(root)" options={{ headerShown: false }} />
    //   {/* Hide header for your index redirect file if needed */}
    //   <Stack.Screen name="index" options={{ headerShown: false }} />
      
    // </Stack>
     <Stack screenOptions={{ headerShown: false }} />
  );
}
