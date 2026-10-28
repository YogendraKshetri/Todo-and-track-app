import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { saveTask } from "@/utils/storage";

function parseScheduledDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function CreateScreen() {
  const router = useRouter();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date] = useState(() => parseScheduledDate(dateParam));
  const [startTime, setStartTime] = useState(() => formatTime(new Date()));
  const [endTime, setEndTime] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 1);
    return formatTime(end);
  });
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("Michael");

  const formatDate = (dateValue: Date) => {
    return dateValue.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const createTask = async () => {
    if (!title.trim()) {
      return;
    }

    const isValidTime = (value: string) =>
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime) ||
      endTime <= startTime
    ) {
      Alert.alert(
        "Check the task time",
        "Enter valid 24-hour times, and make sure the end time is after the start time.",
      );
      return;
    }

    const scheduledDate = new Date(date);
    const [hours, minutes] = startTime.split(":").map(Number);
    scheduledDate.setHours(hours, minutes, 0, 0);

    const task = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      startDate: scheduledDate.toISOString(),
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
      priority,
      assignedTo: assignee || "Unassigned",
      status: "Ongoing",
    };

    const saved = await saveTask(task);
    if (saved) {
      console.log("Created task:", task);
      router.back();
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color="#10163D" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create Task</Text>

          <View style={{ width: 42 }} />
        </View>

        {/* Project Title */}
        <Text style={styles.label}>Project Title</Text>

        <View style={styles.inputBox}>
          <Ionicons name="clipboard-outline" size={18} color="#B8BBC5" />

          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            placeholderTextColor="#B8BBC5"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>

        <View style={[styles.inputBox, styles.descriptionBox]}>
          <Ionicons
            name="clipboard-outline"
            size={18}
            color="#B8BBC5"
            style={styles.descriptionIcon}
          />

          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Enter task Description"
            placeholderTextColor="#B8BBC5"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Text style={styles.label}>Start Date</Text>

        <TouchableOpacity style={styles.inputBox}>
          <Ionicons name="calendar-outline" size={17} color="#8F929D" />

          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Task time</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeInputBox}>
            <Text style={styles.timeCaption}>START</Text>
            <TextInput
              accessibilityLabel="Task start time"
              style={styles.timeInput}
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              placeholder="09:00"
              placeholderTextColor="#B8BBC5"
            />
          </View>
          <Ionicons name="arrow-forward" size={16} color="#8F929D" />
          <View style={styles.timeInputBox}>
            <Text style={styles.timeCaption}>END</Text>
            <TextInput
              accessibilityLabel="Task end time"
              style={styles.timeInput}
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              placeholder="10:00"
              placeholderTextColor="#B8BBC5"
            />
          </View>
        </View>
        <Text style={styles.timeHint}>Use 24-hour time, for example 14:30.</Text>

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>

        <View style={styles.priorityRow}>
          {["Medium", "High", "Low"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.priorityButton,
                priority === item && styles.selectedPriority,
              ]}
              onPress={() => setPriority(item)}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === item && styles.selectedPriorityText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Assigned For */}
        <Text style={styles.label}>Assigned for</Text>

        <View style={styles.assigneeRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>

          <View style={styles.assigneeTag}>
            <Text style={styles.assigneeName}>{assignee}</Text>

            <TouchableOpacity onPress={() => setAssignee("")}>
              <Ionicons name="close" size={15} color="#777B87" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#10163D" />
          </TouchableOpacity>
        </View>

        {/* Upload */}
        <Text style={styles.label}>Upload File</Text>

        <TouchableOpacity style={styles.uploadBox}>
          <Ionicons name="cloud-upload-outline" size={24} color="#777B87" />

          <Text style={styles.fileSize}>2.5 MB File</Text>
        </TouchableOpacity>

        {/* Create Button */}
        <TouchableOpacity style={styles.createButton} onPress={createTask}>
          <Ionicons name="add" size={21} color="#fff" />

          <Text style={styles.createText}>Create Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 35,
  },

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F6F9",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10163D",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#15182B",
    marginTop: 18,
    marginBottom: 9,
  },

  inputBox: {
    height: 58,
    backgroundColor: "#F3F4F8",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#20243A",
  },

  descriptionBox: {
    height: 105,
    alignItems: "flex-start",
    paddingTop: 18,
  },

  descriptionIcon: {
    marginTop: 1,
  },

  descriptionInput: {
    height: 75,
  },
  dateText: {
    marginLeft: 10,
    color: "#8F929D",
    fontSize: 13,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  timeInputBox: {
    flex: 1,
    height: 64,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: "#F3F4F8",
    justifyContent: "center",
  },

  timeCaption: {
    color: "#8F929D",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  timeInput: {
    padding: 0,
    marginTop: 3,
    color: "#20243A",
    fontSize: 16,
    fontWeight: "600",
  },

  timeHint: {
    marginTop: 7,
    color: "#8F929D",
    fontSize: 11,
  },

  placeholder: {
    marginLeft: 10,
    color: "#B8BBC5",
    fontSize: 13,
  },

  priorityRow: {
    flexDirection: "row",
    gap: 10,
  },

  priorityButton: {
    height: 38,
    minWidth: 62,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F4F4F7",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedPriority: {
    backgroundColor: "#FF7782",
  },

  priorityText: {
    fontSize: 12,
    color: "#333647",
    fontWeight: "500",
  },

  selectedPriorityText: {
    color: "#FFFFFF",
  },

  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7CB9E8",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  assigneeTag: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "#F4F5F8",
    marginLeft: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  assigneeName: {
    fontSize: 12,
    color: "#343747",
  },

  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F8",
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  uploadBox: {
    height: 125,
    borderWidth: 1,
    borderColor: "#BFC2CA",
    borderStyle: "dashed",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  fileSize: {
    marginTop: 8,
    fontSize: 11,
    color: "#777B87",
  },

  createButton: {
    height: 64,
    borderRadius: 32,
    backgroundColor: "#101744",
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  createText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
