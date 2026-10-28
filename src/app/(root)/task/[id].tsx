import { useCallback, useState } from 'react';
import type { ComponentProps } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteTask, getTasks, type HabitTask, updateTaskCompletion } from '@/utils/storage';

function formatDate(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<HabitTask | null>(null);
  const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      getTasks().then((tasks) => {
        if (isActive) setTask(tasks.find((item) => item.id === id) ?? null);
      });
      return () => {
        isActive = false;
      };
    }, [id]),
  );

  const progress =
    task && 'progress' in task && typeof task.progress === 'number'
      ? Math.max(0, Math.min(100, task.progress))
      : 0;
  const completed = !!task && 'status' in task && task.status === 'Completed';

  const handleCompletionToggle = async () => {
    if (!task || isUpdatingCompletion) return;
    setIsUpdatingCompletion(true);
    try {
      const updated = await updateTaskCompletion(task.id, !completed);
      if (!updated) {
        Alert.alert('Task not found', 'This task may already have been deleted.');
        return;
      }
      setTask({
        ...task,
        status: completed ? 'Ongoing' : 'Completed',
        completedAt: completed ? undefined : new Date().toISOString(),
      });
    } catch {
      Alert.alert('Update failed', 'The task status could not be updated. Please try again.');
    } finally {
      setIsUpdatingCompletion(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete task?',
      `“${task?.title || 'Untitled task'}” will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const deleted = await deleteTask(id);
                if (deleted) {
                  router.replace('/(root)/(tabs)');
                } else {
                  Alert.alert('Task not found', 'This task may already have been deleted.');
                  router.back();
                }
              } catch {
                Alert.alert('Delete failed', 'The task could not be deleted. Please try again.');
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={22} color="#18213F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.headerButton}>
          <Ionicons name="list-outline" size={20} color="#18213F" />
        </View>
      </View>

      {task ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleCard}>
            <Text style={styles.eyebrow}>TASK</Text>
            <Text style={styles.title}>{task.title || 'Untitled task'}</Text>
            <Text style={styles.description}>
              {task.description?.trim() || 'No description added.'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Task features</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={completed ? 'Mark task as ongoing' : 'Mark task as completed'}
            disabled={isUpdatingCompletion}
            onPress={() => void handleCompletionToggle()}
            style={[styles.completionButton, completed && styles.reopenButton]}
          >
            <Ionicons
              name={completed ? 'refresh-outline' : 'checkmark-circle-outline'}
              size={19}
              color={completed ? '#59627A' : '#fff'}
            />
            <Text style={[styles.completionButtonText, completed && styles.reopenButtonText]}>
              {isUpdatingCompletion
                ? 'Updating...'
                : completed
                  ? 'Mark as ongoing'
                  : 'Mark as completed'}
            </Text>
          </TouchableOpacity>
          <View style={styles.featureList}>
            <FeatureRow
              icon="calendar-outline"
              label="Start date"
              value={formatDate(task.startDate)}
            />
            <FeatureRow
              icon="flag-outline"
              label="Priority"
              value={task.priority || 'Medium'}
            />
            <FeatureRow
              icon="people-outline"
              label="Assigned to"
              value={task.assignedTo?.trim() || 'Unassigned'}
            />
            <FeatureRow
              icon="checkmark-circle-outline"
              label="Status"
              value={completed ? 'Completed' : 'Ongoing'}
            />
            <FeatureRow
              icon="trending-up-outline"
              label="Progress"
              value={`${progress}%`}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Delete task"
              onPress={handleDelete}
              style={styles.deleteRow}
            >
              <View style={styles.deleteIcon}>
                <Ionicons name="trash-outline" size={19} color="#C93645" />
              </View>
              <Text style={styles.deleteLabel}>Delete task</Text>
              <Ionicons name="chevron-forward" size={17} color="#C93645" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={34} color="#858A98" />
          <Text style={styles.notFoundTitle}>Task not found</Text>
          <Text style={styles.notFoundMessage}>
            This task may have been removed. Go back to your task list and try again.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function FeatureRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.featureRow, !last && styles.featureDivider]}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={19} color="#59627A" />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    color: '#18213F',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  titleCard: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: '#fff',
  },
  eyebrow: {
    color: '#858A98',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 10,
    color: '#171C36',
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    marginTop: 10,
    color: '#737A8A',
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: {
    marginTop: 27,
    marginBottom: 12,
    color: '#18213F',
    fontSize: 17,
    fontWeight: '700',
  },
  completionButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 13,
    borderRadius: 16,
    backgroundColor: '#F8662B',
  },
  completionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  reopenButton: {
    backgroundColor: '#E9EDF7',
  },
  reopenButtonText: {
    color: '#59627A',
  },
  featureList: {
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  featureRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAF0',
  },
  featureIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F2F4F8',
  },
  featureLabel: {
    flex: 1,
    color: '#737A8A',
    fontSize: 13,
  },
  featureValue: {
    maxWidth: '48%',
    color: '#18213F',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  deleteRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EAF0',
  },
  deleteIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#FFF0F1',
  },
  deleteLabel: {
    flex: 1,
    color: '#C93645',
    fontSize: 13,
    fontWeight: '600',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  notFoundTitle: {
    marginTop: 12,
    color: '#18213F',
    fontSize: 18,
    fontWeight: '700',
  },
  notFoundMessage: {
    marginTop: 7,
    color: '#858A98',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
