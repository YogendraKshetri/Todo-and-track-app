import AsyncStorage from '@react-native-async-storage/async-storage';

export type HabitTask = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  startTime?: string;
  endTime?: string;
  priority: string;
  assignedTo: string;
  createdAt?: string;
  status?: string;
  completedAt?: string;
  progress?: number;
};

const STORAGE_KEY = 'tasks';

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

async function getStoredTasks(): Promise<HabitTask[]> {
  if (canUseBrowserStorage()) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function setStoredTasks(tasks: HabitTask[]) {
  if (canUseBrowserStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks to browser storage:', error);
      throw error;
    }
    return;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to AsyncStorage:', error);
    if (canUseBrowserStorage()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return;
      } catch (fallbackError) {
        console.error('Failed to save tasks to browser storage fallback:', fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

export async function saveTask(task: HabitTask) {
  try {
    const tasks = await getStoredTasks();
    tasks.push(task);
    await setStoredTasks(tasks);
    return true;
  } catch (error) {
    console.error('Failed to save task:', error);
    return false;
  }
}

export async function getTasks(): Promise<HabitTask[]> {
  try {
    return await getStoredTasks();
  } catch (error) {
    console.error('Failed to load tasks from storage:', error);
    return [];
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const tasks = await getStoredTasks();
  const remainingTasks = tasks.filter((task) => task.id !== taskId);
  if (remainingTasks.length === tasks.length) return false;

  await setStoredTasks(remainingTasks);
  return true;
}

export async function updateTaskCompletion(
  taskId: string,
  completed: boolean,
): Promise<boolean> {
  const tasks = await getStoredTasks();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return false;

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    status: completed ? 'Completed' : 'Ongoing',
    completedAt: completed ? new Date().toISOString() : undefined,
  };
  await setStoredTasks(tasks);
  return true;
}
