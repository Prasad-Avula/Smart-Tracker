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
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@firebase-local/index'
import {
  type Goal,
  type GoalWithStatus,
  type GoalStatusDoc,
  type CreateGoalInput,
  type UpdateGoalInput,
  type GoalPeriod,
  getStatusWeight,
  goalStatusId,
  getPeriodDateRange,
  getGoalEndDateForPeriod,
} from '../types'
import { FIRESTORE_COLLECTIONS } from '@shared/constants'

const GOALS_COLLECTION = FIRESTORE_COLLECTIONS.GOALS
const GOAL_STATUS_COLLECTION = FIRESTORE_COLLECTIONS.GOAL_STATUS

export async function createGoal(userId: string, data: CreateGoalInput): Promise<Goal> {
  const goalsRef = collection(db, GOALS_COLLECTION)
  const now = serverTimestamp()
  const endDate = getGoalEndDateForPeriod(data.period, data.endDate)
  
  const goalData = {
    ...data,
    endDate,
    userId,
    createdAt: now,
    updatedAt: now,
  }
  
  const newDocRef = doc(goalsRef)
  await setDoc(newDocRef, goalData)
  
  return {
    id: newDocRef.id,
    ...goalData,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Goal
}

export async function updateGoal(userId: string, goalId: string, data: UpdateGoalInput): Promise<Goal | null> {
  const goalRef = doc(db, GOALS_COLLECTION, goalId)
  const goalSnap = await getDoc(goalRef)
  
  if (!goalSnap.exists()) return null
  if (goalSnap.data().userId !== userId) return null

  const existingData = goalSnap.data()
  const period = (data.period ?? existingData.period) as GoalPeriod

  const updateData = {
    ...data,
    // Weekly and monthly dates are derived from the current period. Yearly
    // dates remain user-selectable, but must stay inside this calendar year.
    endDate: getGoalEndDateForPeriod(period, data.endDate ?? existingData.endDate),
    updatedAt: serverTimestamp(),
  }

  await updateDoc(goalRef, updateData)

  const updatedSnap = await getDoc(goalRef)
  const data2 = updatedSnap.data()!

  return {
    id: updatedSnap.id,
    ...data2,
    createdAt: data2.createdAt?.toDate() || new Date(),
    updatedAt: data2.updatedAt?.toDate() || new Date(),
  } as Goal
}

export async function deleteGoal(userId: string, goalId: string): Promise<boolean> {
  const goalRef = doc(db, GOALS_COLLECTION, goalId)
  const goalSnap = await getDoc(goalRef)

  if (!goalSnap.exists()) return false
  if (goalSnap.data().userId !== userId) return false

  await deleteDoc(goalRef)
  return true
}

export async function getGoalsForPeriod(
  userId: string,
  period: GoalPeriod,
  periodKey: string,
  referenceDate = new Date().toISOString().slice(0, 10),
): Promise<GoalWithStatus[]> {
  const goalsRef = collection(db, GOALS_COLLECTION)
  const goalsQuery = query(
    goalsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  )

  const statusQuery = query(
    collection(db, GOAL_STATUS_COLLECTION),
    where('userId', '==', userId),
    where('periodKey', '==', periodKey),
  )

  // Goal data and status data are independent reads. Fetch them in parallel
  // so the page does not wait for two sequential network round trips.
  const [goalsSnap, statusSnap] = await Promise.all([
    getDocs(goalsQuery),
    getDocs(statusQuery),
  ])
  const allGoals: Goal[] = []

  goalsSnap.forEach((docSnap: any) => {
    const data = docSnap.data()
    allGoals.push({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Goal)
  })

  // Only show goals belonging to the selected tab. Previously the date range
  // was calculated from each goal's own period without checking that period
  // against the selected tab, so a weekly goal could appear in monthly and
  // yearly views when its end date fell inside those larger ranges.
  const periodGoals = allGoals.filter(goal => {
    if (goal.period !== period || !goal.endDate) return false

    const { startDate, endDate } = getPeriodDateRange(period, referenceDate)
    return goal.endDate >= startDate && goal.endDate <= endDate
  })

  const statusMap = new Map<string, GoalStatusDoc>()
  // Status documents are optional until a goal is updated. Missing statuses
  // are represented by the default "not" status below.
  statusSnap.forEach((snap) => {
    const data = snap.data()
    statusMap.set(snap.id, {
      id: snap.id,
      userId: data.userId,
      goalId: data.goalId,
      periodKey: data.periodKey,
      status: data.status,
      statusWeight: data.statusWeight,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    })
  })

  return periodGoals.map(goal => {
    const statusKey = goalStatusId(userId, periodKey, goal.id)
    const statusDoc = statusMap.get(statusKey)

    return {
      ...goal,
      status: statusDoc?.status || "not",
      statusWeight: statusDoc?.statusWeight ?? getStatusWeight("not"),
    }
  })
}

export async function updateGoalStatus(
  userId: string,
  goalId: string,
  periodKey: string,
  status: GoalWithStatus["status"]
): Promise<void> {
  const statusId = goalStatusId(userId, periodKey, goalId)
  const statusRef = doc(db, GOAL_STATUS_COLLECTION, statusId)
  const statusWeight = getStatusWeight(status)

  await setDoc(statusRef, {
    userId,
    goalId: goalId as GoalStatusDoc["goalId"],
    periodKey,
    status,
    statusWeight,
    updatedAt: serverTimestamp(),
  })
}
