import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getTasks, type HabitTask } from '@/utils/storage';

const filters = ['All Tasks', 'Ongoing', 'Completed'] as const;
type TaskFilter = (typeof filters)[number];

const cardColors = ['#D9F5FC', '#FFF0D9', '#FFE1E7'];
const priorityColors: Record<string, { background: string; text: string }> = {
  High: { background: '#63D2ED', text: '#fff' },
  Medium: { background: '#F47C8B', text: '#fff' },
  Low: { background: '#F7B75F', text: '#fff' },
};
const avatarColors = ['#F5AE6A', '#EA8B98', '#58BCD5'];

function formatTaskDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getProgress(task: HabitTask) {
  if (!('progress' in task) || typeof task.progress !== 'number') return 0;
  return Math.max(0, Math.min(100, task.progress));
}

function isCompletedTask(task: HabitTask) {
  return 'status' in task && task.status === 'Completed';
}

function getAssignees(value: string | undefined) {
  const names = (value ?? '')
    .split(/[,&]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 3);
  return names.length > 0 ? names : ['M'];
}

export default function HomeScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<HabitTask[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('All Tasks');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      getTasks().then((storedTasks) => {
        if (isActive) setTasks(storedTasks);
      });
      return () => {
        isActive = false;
      };
    }, []),
  );

  const completedTasks = tasks.filter(isCompletedTask);
  const visibleTasks =
    selectedFilter === 'Completed'
      ? completedTasks
      : selectedFilter === 'Ongoing'
      ? tasks.filter((task) => !isCompletedTask(task))
      : tasks;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top head */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>M</Text>
            </View>
            <View>
              <Text style={styles.pageTitle}>My Tasks</Text>
              <View style={styles.listSelector}>
                <Text style={styles.listSelectorText}>List</Text>
                <Ionicons name="chevron-down" size={14} color="#858A98" />
              </View>
            </View>
          </View>
          <TouchableOpacity
            accessibilityLabel="Notifications"
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={21} color="#18213F" />
          </TouchableOpacity>
        </View>
        
        {/* catagory section */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const count =
              filter === 'Completed'
                ? completedTasks.length
                : filter === 'Ongoing'
                  ? tasks.length - completedTasks.length
                  : tasks.length;
            const selected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, selected && styles.selectedFilterChip]}
              >
                <Text style={[styles.filterText, selected && styles.selectedFilterText]}>
                  {filter}
                </Text>
                <Text style={[styles.filterCount, selected && styles.selectedFilterText]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* task section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{selectedFilter === 'All Tasks' ? 'My Task' : selectedFilter}</Text>
          <TouchableOpacity
            onPress={() => setSelectedFilter('All Tasks')}
            style={styles.seeAllButton}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={16} color="#59627A" />
          </TouchableOpacity>
        </View>

        {visibleTasks.length > 0 ? (
          visibleTasks.map((task, index) => {
            const priority = priorityColors[task.priority] ?? priorityColors.Medium;
            const progress = getProgress(task);
            const assignees = getAssignees(task.assignedTo);
            return (
              <TouchableOpacity
                key={task.id || `${task.title}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`Open ${task.title || 'task'} details`}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(root)/task/[id]',
                    params: { id: task.id },
                  })
                }
                style={[styles.taskCard, { backgroundColor: cardColors[index % cardColors.length] }]}
              >
                <View style={styles.taskCardTop}>
                  <View style={styles.taskDetails}>
                    <Text numberOfLines={2} style={styles.taskTitle}>
                      {task.title || 'Untitled task'}
                    </Text>
                    <Text numberOfLines={1} style={styles.taskDescription}>
                      {task.description?.trim() || 'Personal task'}
                    </Text>
                  </View>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressText}>{progress}%</Text>
                  </View>
                  <View style={styles.taskDetailsButton}>
                    <Ionicons name="list-outline" size={20} color="#18213F" />
                  </View>
                </View>

                <View style={styles.taskCardBottom}>
                  <View style={styles.taskMetadata}>
                    <View style={[styles.priorityBadge, { backgroundColor: priority.background }]}>
                      <Text style={[styles.priorityText, { color: priority.text }]}>
                        {task.priority || 'Medium'}
                      </Text>
                    </View>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={14} color="#687187" />
                      <Text style={styles.dateText}>{formatTaskDate(task.startDate)}</Text>
                    </View>
                  </View>
                  <View
                    style={styles.assignees}
                    accessibilityLabel={`Assigned to ${assignees.join(', ')}`}
                  >
                    {assignees.map((assignee, avatarIndex) => (
                      <View
                        key={`${assignee}-${avatarIndex}`}
                        style={[
                          styles.assigneeAvatar,
                          {
                            backgroundColor: avatarColors[avatarIndex],
                            marginLeft: avatarIndex === 0 ? 0 : -9,
                          },
                        ]}
                      >
                        <Text style={styles.assigneeInitial}>
                          {assignee[0].toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-done-outline" size={25} color="#59627A" />
            </View>
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'Completed' ? 'No completed tasks yet' : 'No tasks yet'}
            </Text>
            <Text style={styles.emptyMessage}>
              Create a task to start organizing your day.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* <TouchableOpacity
        accessibilityLabel="Create task"
        onPress={() => router.push('/(root)/(tabs)/create')}
        style={styles.createButton}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 104,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 27,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3C18D',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },
  pageTitle: {
    color: '#151A32',
    fontSize: 21,
    fontWeight: '700',
  },
  listSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  listSelectorText: {
    color: '#858A98',
    fontSize: 13,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F9',
  },
  filters: {
    gap: 9,
    paddingBottom: 27,
  },
  filterChip: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 15,
    borderRadius: 22,
    backgroundColor: '#F5F6F8',
  },
  selectedFilterChip: {
    backgroundColor: '#E9EDF7',
  },
  filterText: {
    color: '#797E8D',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#18213F',
    fontWeight: '700',
  },
  filterCount: {
    color: '#73798A',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#151A32',
    fontSize: 19,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#59627A',
    fontSize: 13,
    fontWeight: '500',
  },
  taskCard: {
    minHeight: 168,
    justifyContent: 'space-between',
    padding: 17,
    marginBottom: 14,
    borderRadius: 22,
  },
  taskCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  taskDetailsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  taskDetails: {
    flex: 1,
    paddingTop: 4,
  },
  taskTitle: {
    color: '#171C36',
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 24,
  },
  taskDescription: {
    color: '#737A8A',
    fontSize: 13,
    marginTop: 7,
  },
  progressCircle: {
    width: 53,
    height: 53,
    borderRadius: 27,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#202641',
    fontSize: 11,
    fontWeight: '700',
  },
  taskCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 18,
  },
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  priorityBadge: {
    minWidth: 64,
    minHeight: 35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateBadge: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  dateText: {
    color: '#586177',
    fontSize: 11,
  },
  assignees: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitial: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 42,
    borderRadius: 22,
    backgroundColor: '#F7F8FA',
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EDF7',
    marginBottom: 13,
  },
  emptyTitle: {
    color: '#18213F',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyMessage: {
    color: '#858A98',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  createButton: {
    position: 'absolute',
    left: '50%',
    bottom: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18213F',
    transform: [{ translateX: -31 }],
    boxShadow: '0px 4px 8px rgba(24, 33, 63, 0.2)',
  },
});
