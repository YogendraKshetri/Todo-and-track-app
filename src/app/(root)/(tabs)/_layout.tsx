import { NativeTabs } from 'expo-router/native-tabs';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calender">
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="calendar-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="add-circle-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="record">
        <NativeTabs.Trigger.Label>Record</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="document-text-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="setting">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings-outline" />} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
