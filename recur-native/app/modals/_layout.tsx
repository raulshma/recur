import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="add-subscription" 
        options={{ 
          title: 'Add Subscription',
          presentation: 'modal',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="edit-subscription" 
        options={{ 
          title: 'Edit Subscription',
          presentation: 'modal',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="add-category" 
        options={{ 
          title: 'Add Category',
          presentation: 'modal',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="edit-category" 
        options={{ 
          title: 'Edit Category',
          presentation: 'modal',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}