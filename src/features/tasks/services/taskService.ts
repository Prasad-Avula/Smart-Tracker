import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  serverTimestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore'
import { db } from '@firebase-local/index'
import {
  type Task,
  type TaskWithStatus,
  type TaskStatusDoc,
  type CreateTaskInput,
  type UpdateTaskInput,
  getStatusWeight,
  getDatesInRange,
  isTaskActiveOnDate,
  taskStatusId,
  canDeleteTask,
} from '../types'
import { TASKS_COLLECTION, TASK_STATUS_COLLECTION } from '@shared/constants'
import { type DateString } from '@shared/types'
import { getTodayKey } from '@shared/utils/dateUtils'

export async function createTask(userId: string, data: CreateTaskInput): Promise<Task> {
  const tasksRef = collection(db, TASKS_COLLECTION)
  const now = serverTimestamp()
  
  const taskData = {
    ...data,
    userId,
    // Keep the user's local calendar date so same-day deletion does not rely
    // on server-timestamp resolution or timezone conversion.
    createdDate: getTodayKey() as DateString,
    createdAt: now,
    updatedAt: now,
  }
  
  const newDocRef = doc(tasksRef)
  await setDoc(newDocRef, taskData)
  
  return {
    ...taskData,
    id: newDocRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Task
}

export async function updateTask(userId: string, taskId: string, data: UpdateTaskInput): Promise<Task | null> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId)
  const taskSnap = await getDoc(taskRef)
  
  if (!taskSnap.exists()) return null
  if (taskSnap.data().userId !== userId) return null

  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  }

  await updateDoc(taskRef, updateData)
  
  const updatedSnap = await getDoc(taskRef)
  const data2 = updatedSnap.data()!
  
  return {
    ...data2,
    id: updatedSnap.id,
    createdAt: data2.createdAt?.toDate() || new Date(),
    updatedAt: data2.updatedAt?.toDate() || new Date(),
  } as Task
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId)
  const taskSnap = await getDoc(taskRef)
  
  if (!taskSnap.exists()) throw new Error('Task not found')
  if (taskSnap.data().userId !== userId) throw new Error('Not authorized')

  const data = taskSnap.data()
  const task = {
    ...data,
    id: taskId,
    createdDate: data.createdDate,
    createdAt: data.createdAt?.toDate() || new Date(0),
    updatedAt: data.updatedAt?.toDate() || new Date(0),
  } as Task

  if (!canDeleteTask(task)) {
    throw new Error('This task can no longer be deleted')
  }

  await deleteDoc(taskRef)
}

export async function getTasksForDate(userId: string, date: string): Promise<TaskWithStatus[]> {
  const tasksRef = collection(db, TASKS_COLLECTION)
  const tasksQuery = query(
    tasksRef,
    where('userId', '==', userId)
  )
  
  const statusQuery = query(
    collection(db, TASK_STATUS_COLLECTION),
    where('userId', '==', userId),
    where('date', '==', date),
  )

  // These reads are independent. Running them together removes one full
  // network round trip from the initial task load.
  const [tasksSnap, statusSnap] = await Promise.all([
    getDocs(tasksQuery),
    getDocs(statusQuery),
  ])
  const allTasks: Task[] = []
  
  tasksSnap.forEach((docSnap: any) => {
    const data = docSnap.data()
    allTasks.push({
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Task)
  })

  // Show the newest task first. Sorting locally avoids requiring a new
  // descending Firestore composite index for this list.
  allTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const activeTasks = allTasks.filter(task => isTaskActiveOnDate(task, date as DateString))

  const statusMap = new Map<string, TaskStatusDoc>()
  // Status documents are optional until a task is updated. Missing statuses
  // are represented by the default "not" status below.
  statusSnap.forEach((snap) => {
    const data = snap.data()
    statusMap.set(snap.id, {
      id: snap.id,
      userId: data.userId,
      taskId: data.taskId,
      date: data.date,
      status: data.status,
      statusWeight: data.statusWeight,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    })
  })

  return activeTasks.map(task => {
    const statusKey = taskStatusId(userId, date, task.id)
    const statusDoc = statusMap.get(statusKey)
    
    return {
      ...task,
      status: statusDoc?.status || 'not',
      statusWeight: statusDoc?.statusWeight ?? getStatusWeight('not'),
    }
  })
}

export async function updateTaskStatus(
  userId: string, 
  taskId: string, 
  date: string, 
  status: TaskWithStatus['status']
): Promise<void> {
  const statusId = taskStatusId(userId, date, taskId)
  const statusRef = doc(db, TASK_STATUS_COLLECTION, statusId)
  const statusWeight = getStatusWeight(status)

  await setDoc(statusRef, {
    userId,
    taskId: taskId as TaskStatusDoc['taskId'],
    date,
    status,
    statusWeight,
    updatedAt: serverTimestamp(),
  })
}

export async function getTasksInDateRange(
  userId: string, 
  startDate: string, 
  endDate: string
): Promise<Map<string, TaskWithStatus[]>> {
  const tasksRef = collection(db, TASKS_COLLECTION)
  const tasksQuery = query(
    tasksRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  )
  
  const tasksSnap: QuerySnapshot<DocumentData> = await getDocs(tasksQuery)
  const allTasks: Task[] = []
  
  tasksSnap.forEach((docSnap: any) => {
    const data = docSnap.data()
    allTasks.push({
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Task)
  })

  const result = new Map<string, TaskWithStatus[]>()
  
  for (const task of allTasks) {
    if (task.type === 'once' && task.specificDate) {
      if (task.specificDate >= startDate && task.specificDate <= endDate) {
        const existing = result.get(task.specificDate) || []
        existing.push({ ...task, status: 'not', statusWeight: 0 })
        result.set(task.specificDate, existing)
      }
    } else if (task.type === 'recurring' && task.startDate && task.endDate) {
      const taskStart = task.startDate > startDate ? task.startDate : startDate
      const taskEnd = task.endDate < endDate ? task.endDate : endDate
      
      if (taskStart <= taskEnd) {
        const dates = getDatesInRange(taskStart as DateString, taskEnd as DateString)
        for (const date of dates) {
          const existing = result.get(date) || []
          existing.push({ ...task, status: 'not', statusWeight: 0 })
          result.set(date, existing)
        }
      }
    }
  }

  const allStatusIds: string[] = []
  result.forEach((tasks: TaskWithStatus[], date: string) => {
    tasks.forEach((task: TaskWithStatus) => {
      allStatusIds.push(taskStatusId(userId, date, task.id))
    })
  })

  if (allStatusIds.length > 0) {
    const statusPromises = allStatusIds.map(id => getDoc(doc(db, TASK_STATUS_COLLECTION, id)))
    const statusSnaps = await Promise.all(statusPromises)

    const statusMap = new Map<string, TaskStatusDoc>()
    statusSnaps.forEach((snap: any) => {
      if (snap.exists()) {
        const data = snap.data()
        statusMap.set(snap.id, {
          id: snap.id,
          userId: data.userId,
          taskId: data.taskId,
          date: data.date,
          status: data.status,
          statusWeight: data.statusWeight,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      }
    })

    result.forEach((tasks: TaskWithStatus[], date: string) => {
      tasks.forEach((task: TaskWithStatus) => {
        const statusKey = taskStatusId(userId, date, task.id)
        const statusDoc = statusMap.get(statusKey)
        if (statusDoc) {
          task.status = statusDoc.status
          task.statusWeight = statusDoc.statusWeight
        }
      })
    })
  }

  return result
}

export type RecurringEditMode = 'this_day' | 'all_future'

export async function updateRecurringTask(
  userId: string,
  taskId: string,
  data: UpdateTaskInput,
  mode: RecurringEditMode,
  currentDate: string
): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId)
  const taskSnap = await getDoc(taskRef)
  
  if (!taskSnap.exists()) throw new Error('Task not found')
  if (taskSnap.data().userId !== userId) throw new Error('Not authorized')

  if (mode === 'all_future') {
    // Update the main task document
    await updateDoc(taskRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } else {
    // "This day only" - create a one-time override task for this date
    // This creates a separate task that only exists for this specific date
    const originalTask = taskSnap.data() as Task
    
    const overrideData = {
      userId,
      title: data.title ?? originalTask.title,
      type: 'once' as const,
      priority: data.priority ?? originalTask.priority,
      specificDate: currentDate,
      isRecurringOverride: true,
      originalTaskId: taskId,
      createdDate: getTodayKey() as DateString,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const tasksRef = collection(db, TASKS_COLLECTION)
    const newDocRef = doc(tasksRef)
    await setDoc(newDocRef, overrideData)
  }
}

export async function deleteRecurringTask(
  userId: string,
  taskId: string,
  mode: RecurringEditMode,
  currentDate: string
): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId)
  const taskSnap = await getDoc(taskRef)
  
  if (!taskSnap.exists()) throw new Error('Task not found')
  if (taskSnap.data().userId !== userId) throw new Error('Not authorized')

  const data = taskSnap.data()
  const task = {
    ...data,
    id: taskId,
    createdDate: data.createdDate,
    createdAt: data.createdAt?.toDate() || new Date(0),
    updatedAt: data.updatedAt?.toDate() || new Date(0),
  } as Task

  if (!canDeleteTask(task)) {
    throw new Error('This task can no longer be deleted')
  }

  if (mode === 'all_future') {
    // Delete the main recurring task
    await deleteDoc(taskRef)
    
    // Also delete all status entries for this recurring task
    // This is a cleanup - in practice you might want to keep history
  } else {
    // "This day only" - create a deletion marker or skip status
    // We'll create a status with a special marker to indicate "skipped"
    const statusId = taskStatusId(userId, currentDate, taskId)
    const statusRef = doc(db, TASK_STATUS_COLLECTION, statusId)
    
    await setDoc(statusRef, {
      userId,
      taskId,
      date: currentDate,
      status: 'skipped',
      statusWeight: 0,
      isSkipped: true,
      updatedAt: serverTimestamp(),
    })
  }
}

