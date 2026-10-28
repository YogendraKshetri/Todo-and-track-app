import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getTasks, type HabitTask } from '@/utils/storage';

const periods = ['Daily', 'Weekly', 'Monthly'] as const;
type Period = (typeof periods)[number];

type ActivityBucket = {
  label: string;
  created: number;
  completed: number;
};

function getTaskCreatedDate(task: HabitTask) {
  const date = new Date(task.createdAt || task.startDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTaskCompletedDate(task: HabitTask) {
  if (task.status !== 'Completed') return null;
  const date = new Date(task.completedAt || task.createdAt || task.startDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getActivityBuckets(period: Period, tasks: HabitTask[], now: Date): ActivityBucket[] {
  let buckets: ActivityBucket[];

  if (period === 'Daily') {
    buckets = ['12a', '6a', '12p', '6p'].map((label) => ({
      label,
      created: 0,
      completed: 0,
    }));
    const today = getDateKey(now);
    tasks.forEach((task) => {
      const createdDate = getTaskCreatedDate(task);
      if (createdDate && getDateKey(createdDate) === today) {
        buckets[Math.floor(createdDate.getHours() / 6)].created += 1;
      }

      const completedDate = getTaskCompletedDate(task);
      if (completedDate && getDateKey(completedDate) === today) {
        buckets[Math.floor(completedDate.getHours() / 6)].completed += 1;
      }
    });
    return buckets;
  }

  if (period === 'Weekly') {
    buckets = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
      return {
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        created: 0,
        completed: 0,
      };
    });
    tasks.forEach((task) => {
      const createdDate = getTaskCreatedDate(task);
      if (createdDate) {
        const dayOffset = Math.floor(
          (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
            new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime()) /
            86400000,
        );
        if (dayOffset >= 0 && dayOffset < buckets.length) buckets[buckets.length - 1 - dayOffset].created += 1;
      }

      const completedDate = getTaskCompletedDate(task);
      if (completedDate) {
        const dayOffset = Math.floor(
          (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
            new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate()).getTime()) /
            86400000,
        );
        if (dayOffset >= 0 && dayOffset < buckets.length) buckets[buckets.length - 1 - dayOffset].completed += 1;
      }
    });
    return buckets;
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const bucketCount = Math.ceil(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7,
  );
  buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: `${index * 7 + 1}`,
    created: 0,
    completed: 0,
  }));

  tasks.forEach((task) => {
    const createdDate = getTaskCreatedDate(task);
    if (
      createdDate &&
      createdDate.getFullYear() === now.getFullYear() &&
      createdDate.getMonth() === now.getMonth()
    ) {
      buckets[Math.floor((createdDate.getDate() - 1) / 7)].created += 1;
    }

    const completedDate = getTaskCompletedDate(task);
    if (
      completedDate &&
      completedDate.getFullYear() === now.getFullYear() &&
      completedDate.getMonth() === now.getMonth()
    ) {
      buckets[Math.floor((completedDate.getDate() - 1) / 7)].completed += 1;
    }
  });

  if (monthStart.getMonth() !== now.getMonth()) return [];
  return buckets;
}

function getPeriodCaption(period: Period, now: Date) {
  if (period === 'Daily') {
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (period === 'Weekly') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function RecordScreen() {
  const [tasks, setTasks] = useState<HabitTask[]>([]);
  const [period, setPeriod] = useState<Period>('Weekly');
  const now = new Date();

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

  const buckets = useMemo(() => getActivityBuckets(period, tasks, now), [period, tasks]);
  const createdInPeriod = buckets.reduce((total, bucket) => total + bucket.created, 0);
  const completedInPeriod = buckets.reduce((total, bucket) => total + bucket.completed, 0);
  const completedTotal = tasks.filter((task) => task.status === 'Completed').length;
  const ongoingTotal = tasks.length - completedTotal;
  const completionPercent =
    tasks.length === 0 ? 0 : Math.round((completedTotal / tasks.length) * 100);
  const maxActivity = Math.max(
    1,
    ...buckets.map((bucket) => Math.max(bucket.created, bucket.completed)),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Statistics</Text>
          <TouchableOpacity
            accessibilityLabel="Notifications"
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={20} color="#6B7080" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.periodSelector}>
          {periods.map((item) => {
            const selected = item === period;
            return (
              <TouchableOpacity
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPeriod(item)}
                style={[styles.periodButton, selected && styles.selectedPeriodButton]}
              >
                <Text style={[styles.periodText, selected && styles.selectedPeriodText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.activityCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardEyebrow}>
              <Ionicons name="flash-outline" size={15} color="#fff" />
              <Text style={styles.cardEyebrowText}>TASK ACTIVITY</Text>
            </View>
            <Ionicons name="ellipsis-horizontal" size={20} color="#D0D1D4" />
          </View>

          <View style={styles.activitySummary}>
            <View>
              <Text style={styles.activityValue}>{completedInPeriod}</Text>
              <Text style={styles.activityLabel}>completed</Text>
            </View>
            <View style={styles.periodDate}>
              <View style={styles.dateCheck}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <Text style={styles.dateText}>{getPeriodCaption(period, now)}</Text>
            </View>
          </View>
          <Text style={styles.createdSummary}>
            {createdInPeriod} {createdInPeriod === 1 ? 'task' : 'tasks'} created
          </Text>

          <View style={styles.chart}>
            {buckets.map((bucket) => {
              const createdHeight = (bucket.created / maxActivity) * 112;
              const completedHeight = (bucket.completed / maxActivity) * 112;
              return (
                <View key={bucket.label} style={styles.chartColumn}>
                  <View style={styles.barGroup}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          styles.createdBar,
                          { height: Math.max(bucket.created ? 8 : 3, createdHeight) },
                        ]}
                      />
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          styles.completedBar,
                          { height: Math.max(bucket.completed ? 8 : 3, completedHeight) },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.chartLabel}>{bucket.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendCreated]} />
              <Text style={styles.legendText}>Created</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendCompleted]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <Text style={styles.summaryHeading}>Completion summary</Text>
            <Ionicons name="ellipsis-horizontal" size={20} color="#D0D1D4" />
          </View>

          <View style={styles.completionSummary}>
            <View>
              <Text style={styles.completionPercent}>{completionPercent}%</Text>
              <Text style={styles.summaryCaption}>of all tasks completed</Text>
            </View>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-done-outline" size={22} color="#F8662B" />
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressCompleted,
                { width: `${completionPercent}%` },
              ]}
            />
          </View>

          <View style={styles.statusCounts}>
            <View style={styles.statusCount}>
              <View style={[styles.statusDot, styles.completedDot]} />
              <Text style={styles.statusLabel}>Completed</Text>
              <Text style={styles.statusValue}>{completedTotal}</Text>
            </View>
            <View style={styles.statusCount}>
              <View style={[styles.statusDot, styles.ongoingDot]} />
              <Text style={styles.statusLabel}>In progress</Text>
              <Text style={styles.statusValue}>{ongoingTotal}</Text>
            </View>
          </View>

          {tasks.length === 0 && (
            <Text style={styles.emptySummary}>Create a task to start building your statistics.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7F5',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageTitle: {
    color: '#171717',
    fontSize: 27,
    fontWeight: '700',
  },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEDEB',
    borderRadius: 22,
    backgroundColor: '#fff',
  },
  notificationDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F8662B',
  },
  periodSelector: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    marginBottom: 20,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  periodButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  selectedPeriodButton: {
    backgroundColor: '#F8662B',
  },
  periodText: {
    color: '#687080',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedPeriodText: {
    color: '#fff',
    fontWeight: '600',
  },
  activityCard: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    marginBottom: 18,
    borderRadius: 26,
    backgroundColor: '#fff',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEyebrow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: '#F8662B',
  },
  cardEyebrowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  activitySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  activityValue: {
    color: '#171717',
    fontSize: 31,
    fontWeight: '700',
    lineHeight: 36,
  },
  activityLabel: {
    marginTop: 1,
    color: '#777B83',
    fontSize: 12,
  },
  periodDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateCheck: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#F8662B',
  },
  dateText: {
    color: '#686B71',
    fontSize: 12,
  },
  createdSummary: {
    marginTop: 4,
    color: '#9699A0',
    fontSize: 12,
  },
  chart: {
    height: 184,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barGroup: {
    height: 142,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  barTrack: {
    width: 17,
    height: 118,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#FFF4EE',
  },
  bar: {
    width: '100%',
    borderRadius: 10,
  },
  createdBar: {
    backgroundColor: '#171717',
  },
  completedBar: {
    backgroundColor: '#F8662B',
  },
  chartLabel: {
    marginTop: 10,
    color: '#74767D',
    fontSize: 10,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendCreated: {
    backgroundColor: '#171717',
  },
  legendCompleted: {
    backgroundColor: '#F8662B',
  },
  legendText: {
    color: '#777B83',
    fontSize: 11,
  },
  summaryCard: {
    paddingHorizontal: 22,
    paddingVertical: 23,
    borderRadius: 26,
    backgroundColor: '#fff',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryHeading: {
    color: '#696B70',
    fontSize: 17,
    fontWeight: '600',
  },
  completionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  completionPercent: {
    color: '#171717',
    fontSize: 29,
    fontWeight: '600',
  },
  summaryCaption: {
    marginTop: 2,
    color: '#888A90',
    fontSize: 12,
  },
  completionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFF1EA',
  },
  progressTrack: {
    height: 11,
    overflow: 'hidden',
    marginTop: 19,
    borderRadius: 6,
    backgroundColor: '#E7E8EC',
  },
  progressCompleted: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#F8662B',
  },
  statusCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  statusCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completedDot: {
    backgroundColor: '#F8662B',
  },
  ongoingDot: {
    backgroundColor: '#171717',
  },
  statusLabel: {
    color: '#777B83',
    fontSize: 11,
  },
  statusValue: {
    marginLeft: 2,
    color: '#171717',
    fontSize: 12,
    fontWeight: '700',
  },
  emptySummary: {
    marginTop: 18,
    color: '#9699A0',
    fontSize: 12,
    textAlign: 'center',
  },
});
