import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { getTasks, type HabitTask } from "@/utils/storage";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CARD_COLORS = ["#222323", "#242322", "#222424", "#252323"];
const ACCENT_COLORS = ["#FFE5B5", "#B8EFE6", "#D8E6FF", "#F5C7D1"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTaskDate(task: HabitTask) {
  const date = new Date(task.startDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTaskStartTime(task: HabitTask, date: Date) {
  if (task.startTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(task.startTime)) {
    return task.startTime;
  }

  const createdAt = new Date(task.createdAt || task.startDate);
  const timeSource = Number.isNaN(createdAt.getTime()) ? date : createdAt;
  return `${String(timeSource.getHours()).padStart(2, "0")}:${String(
    timeSource.getMinutes(),
  ).padStart(2, "0")}`;
}

function getTaskEndTime(task: HabitTask, startTime: string) {
  if (task.endTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(task.endTime)) {
    return task.endTime;
  }

  const [hours, minutes] = startTime.split(":").map(Number);
  const end = (hours * 60 + minutes + 60) % (24 * 60);
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(
    end % 60,
  ).padStart(2, "0")}`;
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )} ${suffix}`;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function changeMonth(date: Date, amount: number) {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + amount);
  const finalDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(originalDay, finalDay));
  return result;
}

function getDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [tasks, setTasks] = useState<HabitTask[]>([]);
  const [showMonthGrid, setShowMonthGrid] = useState(false);

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

  const weekDates = useMemo(() => {
    const sunday = addDays(selectedDate, -selectedDate.getDay());
    return Array.from({ length: 7 }, (_, index) => addDays(sunday, index));
  }, [selectedDate]);

  const monthDates = useMemo(() => {
    const firstDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1,
    );
    const gridStart = addDays(firstDay, -firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [selectedDate]);

  const tasksForDate = useMemo(
    () =>
      tasks
        .map((task) => {
          const taskDate = getTaskDate(task);
          if (!taskDate || dateKey(taskDate) !== dateKey(selectedDate)) {
            return null;
          }
          const startTime = getTaskStartTime(task, taskDate);
          return {
            task,
            startTime,
            endTime: getTaskEndTime(task, startTime),
          };
        })
        .filter(
          (
            item,
          ): item is {
            task: HabitTask;
            startTime: string;
            endTime: string;
          } => item !== null,
        )
        .sort((left, right) =>
          left.startTime.localeCompare(right.startTime),
        ),
    [selectedDate, tasks],
  );

  const taskDates = useMemo(() => {
    const keys = new Set<string>();
    tasks.forEach((task) => {
      const taskDate = getTaskDate(task);
      if (taskDate) keys.add(dateKey(taskDate));
    });
    return keys;
  }, [tasks]);

  const monthTitle = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectDate = (date: Date) => setSelectedDate(date);
  const navigateMonth = (amount: number) =>
    setSelectedDate((current) => changeMonth(current, amount));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.monthControls}>
            <TouchableOpacity
              accessibilityLabel="Previous month"
              onPress={() => navigateMonth(-1)}
              style={styles.monthArrow}
            >
              <Ionicons name="chevron-back" size={17} color="#A5A5A5" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthTitle}</Text>
            <TouchableOpacity
              accessibilityLabel="Next month"
              onPress={() => navigateMonth(1)}
              style={styles.monthArrow}
            >
              <Ionicons name="chevron-forward" size={17} color="#A5A5A5" />
            </TouchableOpacity>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              accessibilityLabel="Show weekly timeline"
              onPress={() => setShowMonthGrid(false)}
              style={[
                styles.toggleButton,
                !showMonthGrid && styles.activeToggle,
              ]}
            >
              <Ionicons
                name="list-outline"
                size={19}
                color={!showMonthGrid ? "#181818" : "#A6A6A6"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Show month calendar"
              onPress={() => setShowMonthGrid(true)}
              style={[
                styles.toggleButton,
                showMonthGrid && styles.activeToggle,
              ]}
            >
              <Ionicons
                name="grid-outline"
                size={18}
                color={showMonthGrid ? "#181818" : "#A6A6A6"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {showMonthGrid ? (
          <View style={styles.monthGrid}>
            {WEEKDAYS.map((weekday) => (
              <Text key={weekday} style={styles.monthWeekday}>
                {weekday.slice(0, 1)}
              </Text>
            ))}
            {monthDates.map((date) => {
              const selected = dateKey(date) === dateKey(selectedDate);
              const inCurrentMonth =
                date.getMonth() === selectedDate.getMonth();
              const hasTasks = taskDates.has(dateKey(date));
              return (
                <TouchableOpacity
                  key={dateKey(date)}
                  accessibilityLabel={date.toLocaleDateString()}
                  onPress={() => selectDate(date)}
                  style={styles.monthDayCell}
                >
                  <View
                    style={[
                      styles.monthDay,
                      selected && styles.selectedMonthDay,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthDayText,
                        !inCurrentMonth && styles.outsideMonthText,
                        selected && styles.selectedDateText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.taskDot,
                      hasTasks && styles.visibleTaskDot,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.weekStrip}>
            {weekDates.map((date) => {
              const selected = dateKey(date) === dateKey(selectedDate);
              return (
                <TouchableOpacity
                  key={dateKey(date)}
                  accessibilityLabel={date.toLocaleDateString()}
                  accessibilityState={{ selected }}
                  onPress={() => selectDate(date)}
                  style={styles.weekdayItem}
                >
                  <Text
                    style={[
                      styles.weekdayLabel,
                      selected && styles.selectedDateText,
                    ]}
                  >
                    {WEEKDAYS[date.getDay()]}
                  </Text>
                  <View
                    style={[
                      styles.weekdayDate,
                      selected && styles.selectedWeekdayDate,
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekdayDateText,
                        selected && styles.selectedDateText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.timelineHeader}>
          <View>
            <Text style={styles.timelineEyebrow}>SCHEDULE</Text>
            <Text style={styles.timelineTitle}>{getDateLabel(selectedDate)}</Text>
          </View>
          <Text style={styles.taskCount}>
            {tasksForDate.length}{" "}
            {tasksForDate.length === 1 ? "task" : "tasks"}
          </Text>
        </View>

        <ScrollView
          style={styles.timelineScroll}
          contentContainerStyle={styles.timelineContent}
          showsVerticalScrollIndicator={false}
        >
          {tasksForDate.length > 0 ? (
            tasksForDate.map(({ task, startTime, endTime }, index) => {
              const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
              return (
                <View key={task.id} style={styles.timelineRow}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>{formatTime(startTime)}</Text>
                    <View style={[styles.timelineDot, { backgroundColor: accent }]} />
                    <View style={styles.timelineLine} />
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${task.title || "task"} details`}
                    activeOpacity={0.82}
                    onPress={() =>
                      router.push({
                        pathname: "/(root)/task/[id]",
                        params: { id: task.id },
                      })
                    }
                    style={[
                      styles.taskCard,
                      { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] },
                    ]}
                  >
                    <View style={[styles.cardAccent, { backgroundColor: accent }]} />
                    <View style={styles.cardBody}>
                      <View style={styles.cardTopLine}>
                        <Text style={styles.cardTime}>
                          {formatTime(startTime)} - {formatTime(endTime)}
                        </Text>
                        <View
                          style={[
                            styles.priorityDot,
                            task.priority === "High" && styles.highPriorityDot,
                            task.priority === "Low" && styles.lowPriorityDot,
                          ]}
                        />
                      </View>
                      <Text numberOfLines={2} style={styles.cardTitle}>
                        {task.title || "Untitled task"}
                      </Text>
                      {!!task.description?.trim() && (
                        <Text numberOfLines={2} style={styles.cardDescription}>
                          {task.description.trim()}
                        </Text>
                      )}
                      <View style={styles.cardFooter}>
                        <Text style={styles.priorityLabel}>
                          {task.priority || "Medium"} priority
                        </Text>
                        {!!task.assignedTo?.trim() && (
                          <View style={styles.assignee}>
                            <View style={[styles.assigneeAvatar, { backgroundColor: accent }]}>
                              <Text style={styles.assigneeInitial}>
                                {task.assignedTo.trim()[0].toUpperCase()}
                              </Text>
                            </View>
                            <Text numberOfLines={1} style={styles.assigneeName}>
                              {task.assignedTo.trim()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-clear-outline" size={25} color="#FFE5B5" />
              </View>
              <Text style={styles.emptyTitle}>Nothing scheduled</Text>
              <Text style={styles.emptyDescription}>
                Tasks for this day will appear here in time order.
              </Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Create a task for this day"
          onPress={() =>
            router.push({
              pathname: "/(root)/(tabs)/create",
              params: { date: dateKey(selectedDate) },
            })
          }
          style={styles.addButton}
        >
          <Ionicons name="add" size={30} color="#181818" />
          <Text style={styles.addButtonText}>New task</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111111",
  },
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  header: {
    minHeight: 74,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  monthArrow: {
    width: 27,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    color: "#F5F5F5",
    fontSize: 21,
    fontWeight: "600",
  },
  viewToggle: {
    flexDirection: "row",
    padding: 3,
    borderWidth: 1,
    borderColor: "#414141",
    borderRadius: 12,
    backgroundColor: "#242424",
  },
  toggleButton: {
    width: 38,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  activeToggle: {
    backgroundColor: "#FFE5B5",
  },
  weekStrip: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekdayItem: {
    minWidth: 42,
    alignItems: "center",
    gap: 10,
  },
  weekdayLabel: {
    color: "#999999",
    fontSize: 12,
  },
  weekdayDate: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#292929",
  },
  selectedWeekdayDate: {
    backgroundColor: "#FFE5B5",
  },
  weekdayDateText: {
    color: "#C2C2C2",
    fontSize: 15,
    fontWeight: "600",
  },
  selectedDateText: {
    color: "#171717",
  },
  monthGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 15,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthWeekday: {
    width: `${100 / 7}%`,
    marginBottom: 7,
    color: "#999999",
    textAlign: "center",
    fontSize: 12,
  },
  monthDayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: "center",
  },
  monthDay: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  selectedMonthDay: {
    backgroundColor: "#FFE5B5",
  },
  monthDayText: {
    color: "#E3E3E3",
    fontSize: 13,
  },
  outsideMonthText: {
    color: "#626262",
  },
  taskDot: {
    width: 4,
    height: 4,
    marginTop: 2,
    borderRadius: 2,
  },
  visibleTaskDot: {
    backgroundColor: "#FFE5B5",
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
  },
  timelineHeader: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  timelineEyebrow: {
    marginBottom: 5,
    color: "#969696",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  timelineTitle: {
    color: "#F5F5F5",
    fontSize: 18,
    fontWeight: "600",
  },
  taskCount: {
    marginBottom: 2,
    color: "#A2A2A2",
    fontSize: 12,
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    paddingHorizontal: 17,
    paddingTop: 3,
    paddingBottom: 115,
  },
  timelineRow: {
    minHeight: 126,
    flexDirection: "row",
  },
  timeColumn: {
    width: 75,
    alignItems: "flex-start",
  },
  timeLabel: {
    marginTop: 3,
    marginBottom: 11,
    color: "#B4B4B4",
    fontSize: 11,
  },
  timelineDot: {
    width: 10,
    height: 10,
    marginLeft: 2,
    borderRadius: 5,
  },
  timelineLine: {
    position: "absolute",
    top: 35,
    bottom: 0,
    left: 6,
    width: 1,
    backgroundColor: "#3A3A3A",
  },
  taskCard: {
    flex: 1,
    minHeight: 112,
    marginBottom: 16,
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 3,
  },
  cardAccent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  cardTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTime: {
    color: "#B8B8B8",
    fontSize: 12,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F4C66A",
  },
  highPriorityDot: {
    backgroundColor: "#F17C7C",
  },
  lowPriorityDot: {
    backgroundColor: "#8EC9A4",
  },
  cardTitle: {
    marginTop: 9,
    color: "#F2F2F2",
    fontSize: 16,
    fontWeight: "600",
  },
  cardDescription: {
    marginTop: 5,
    color: "#A5A5A5",
    fontSize: 12,
    lineHeight: 17,
  },
  cardFooter: {
    minHeight: 27,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  priorityLabel: {
    color: "#919191",
    fontSize: 11,
  },
  assignee: {
    maxWidth: "60%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  assigneeAvatar: {
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  assigneeInitial: {
    color: "#202020",
    fontSize: 11,
    fontWeight: "700",
  },
  assigneeName: {
    flexShrink: 1,
    color: "#BDBDBD",
    fontSize: 11,
  },
  emptyState: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: "#25231F",
  },
  emptyTitle: {
    color: "#F0F0F0",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyDescription: {
    marginTop: 7,
    color: "#969696",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  addButton: {
    position: "absolute",
    right: 21,
    bottom: 18,
    height: 54,
    paddingHorizontal: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 28,
    backgroundColor: "#FFE5B5",
    elevation: 5,
  },
  addButtonText: {
    color: "#181818",
    fontSize: 14,
    fontWeight: "600",
  },
});
