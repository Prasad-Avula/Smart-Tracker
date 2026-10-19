import { 
  addDoc,
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit,
  DocumentData,
  QuerySnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@firebase-local/index'
import { 
  type DailySnapshot, 
  type GoalSnapshot
} from '../types'
import { calculateTaskProgress } from '@features/tasks/types'
import { calculateGoalProgress } from '@features/goals/types'
import type { TaskWithStatus } from '@features/tasks/types'
import type { GoalWithStatus } from '@features/goals/types'
import { getTasksForDate } from '@features/tasks/services/taskService'
import { getGoalsForPeriod } from '@features/goals/services/goalService'
import { getPeriodDateRange, getPeriodKey, type GoalPeriod } from '@features/goals/types'
import { FIRESTORE_COLLECTIONS } from '@shared/constants'
import { getYesterdayKey } from '@shared/utils/dateUtils'

const DAILY_HISTORY_COLLECTION = FIRESTORE_COLLECTIONS.DAILY_HISTORY
const GOAL_HISTORY_COLLECTION = FIRESTORE_COLLECTIONS.GOAL_HISTORY

export async function getDailySnapshots(userId: string, limitCount: number = 30): Promise<DailySnapshot[]> {
  const historyRef = collection(db, DAILY_HISTORY_COLLECTION)
  const historyQuery = query(
    historyRef,
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  )

  const snapshot: QuerySnapshot<DocumentData> = await getDocs(historyQuery)
  const snapshots: DailySnapshot[] = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    snapshots.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as DailySnapshot)
  })

  return snapshots
}

export async function getGoalSnapshots(userId: string, period: 'weekly' | 'monthly' | 'yearly', limitCount: number = 12): Promise<GoalSnapshot[]> {
  const historyRef = collection(db, GOAL_HISTORY_COLLECTION)
  const historyQuery = query(
    historyRef,
    where('userId', '==', userId),
    where('period', '==', period),
    orderBy('periodKey', 'desc'),
    limit(limitCount)
  )

  const snapshot: QuerySnapshot<DocumentData> = await getDocs(historyQuery)
  const snapshots: GoalSnapshot[] = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    snapshots.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as GoalSnapshot)
  })

  return snapshots
}

export async function getAllGoalSnapshots(userId: string, limitCount: number = 36): Promise<GoalSnapshot[]> {
  const historyRef = collection(db, GOAL_HISTORY_COLLECTION)
  const historyQuery = query(
    historyRef,
    where('userId', '==', userId),
    orderBy('periodKey', 'desc'),
    limit(limitCount)
  )

  const snapshot: QuerySnapshot<DocumentData> = await getDocs(historyQuery)
  const snapshots: GoalSnapshot[] = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    snapshots.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as GoalSnapshot)
  })

  return snapshots
}

export async function getDailySnapshotForDate(userId: string, date: string): Promise<DailySnapshot | null> {
  const historyRef = collection(db, DAILY_HISTORY_COLLECTION)
  const historyQuery = query(
    historyRef,
    where('userId', '==', userId),
    where('date', '==', date),
    limit(1)
  )

  const snapshot: QuerySnapshot<DocumentData> = await getDocs(historyQuery)
  
  if (snapshot.empty) return null
  
  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as DailySnapshot
}

export async function createDailySnapshot(
  userId: string,
  date: string,
  tasks: TaskWithStatus[]
): Promise<DailySnapshot> {
  const historyRef = collection(db, DAILY_HISTORY_COLLECTION)

  const { progress } = calculateTaskProgress(tasks)
  const mainCount = tasks.filter((t) => t.priority === 'main').length
  const sideCount = tasks.filter((t) => t.priority === 'side').length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const partialTasks = tasks.filter((t) => t.status === 'partial').length

  const snapshotData = {
    userId,
    date,
    progress,
    mainCount,
    sideCount,
    totalTasks: tasks.length,
    completedTasks,
    partialTasks,
    tasks: tasks.map((t) => ({
      id: t.id,
      text: t.title,
      status:
        t.status === 'done' ? 'completed' : t.status === 'partial' ? 'partial' : 'not_done',
      priority: t.priority,
    })),
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(historyRef, snapshotData)

  return {
    id: docRef.id,
    ...snapshotData,
    createdAt: new Date(),
  } as DailySnapshot
}

export async function createGoalSnapshot(
  userId: string,
  periodKey: string,
  period: 'weekly' | 'monthly' | 'yearly',
  goals: GoalWithStatus[]
): Promise<GoalSnapshot> {
  const historyRef = collection(db, GOAL_HISTORY_COLLECTION)

  const { progress } = calculateGoalProgress(goals)
  const completedGoals = goals.filter((g) => g.status === 'done').length

  const snapshotData = {
    userId,
    periodKey,
    period,
    progress,
    totalGoals: goals.length,
    completedGoals,
    partialGoals: 0,
    goals: goals.map((g) => ({
      id: g.id,
      text: g.title,
      status: g.status === 'done' ? 'completed' : 'not_done',
    })),
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(historyRef, snapshotData)

  return {
    id: docRef.id,
    ...snapshotData,
    createdAt: new Date(),
  } as GoalSnapshot
}

const goalPeriods: GoalPeriod[] = ['weekly', 'monthly', 'yearly']
const historyCatchUpPromises = new Map<string, Promise<void>>()

/**
 * Creates snapshots that were missed while the app was closed. This is the
 * free-plan alternative to a scheduled Cloud Function: it runs after auth is
 * restored and is safe to call more than once per app session.
 */
export function ensureHistorySnapshotsForUser(userId: string): Promise<void> {
  const existingPromise = historyCatchUpPromises.get(userId)
  if (existingPromise) return existingPromise

  const catchUpPromise = (async () => {
    const yesterday = getYesterdayKey()

    const dailySnapshot = await getDailySnapshotForDate(userId, yesterday)
    if (!dailySnapshot) {
      const tasks = await getTasksForDate(userId, yesterday)
      await createDailySnapshot(userId, yesterday, tasks)
    }

    // Goal snapshots are created only when a weekly, monthly, or yearly
    // period ended yesterday. The checks are idempotent through the existing
    // history lookup, so reopening the app will not create duplicates.
    for (const period of goalPeriods) {
      const { endDate } = getPeriodDateRange(period, yesterday)
      if (endDate !== yesterday) continue

      const periodKey = getPeriodKey(period, yesterday)
      const existingGoalSnapshot = await getGoalSnapshotForPeriod(userId, period, periodKey)
      if (existingGoalSnapshot) continue

      const goals = await getGoalsForPeriod(userId, period, periodKey, yesterday)
      await createGoalSnapshot(userId, periodKey, period, goals)
    }
  })().finally(() => {
    historyCatchUpPromises.delete(userId)
  })

  historyCatchUpPromises.set(userId, catchUpPromise)
  return catchUpPromise
}

async function getGoalSnapshotForPeriod(
  userId: string,
  period: GoalPeriod,
  periodKey: string,
): Promise<GoalSnapshot | null> {
  const historyQuery = query(
    collection(db, GOAL_HISTORY_COLLECTION),
    where('userId', '==', userId),
    where('period', '==', period),
    where('periodKey', '==', periodKey),
    limit(1),
  )

  const snapshot = await getDocs(historyQuery)
  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as GoalSnapshot
}
