import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

import { SafeAreaView } from 'react-native-safe-area-context';

export default function notification() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Your actual page content goes here */}
      <Text style={styles.text}>Welcome Home!</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
    // SafeAreaView handles top and bottom padding automatically!
  },
  text: {
    fontSize: 18,
  }
});