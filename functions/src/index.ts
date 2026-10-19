import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()
const messaging = admin.messaging()

// Helper to send notification to user's FCM tokens
async function sendToUserTokens(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<number> {
  const userDoc = await db.collection('users').doc(userId).get()
  
  if (!userDoc.exists) {
    console.log('User ' + userId + ' not found')
    return 0
  }
  
  const userData = userDoc.data()!
  const tokens = userData.fcmTokens || []
  
  if (tokens.length === 0) {
    console.log('No FCM tokens for user ' + userId)
    return 0
  }
  
  const validTokens = tokens.filter((token: string) => token && typeof token === 'string')
  
  if (validTokens.length === 0) {
    return 0
  }
  
  try {
    const response = await messaging.sendEachForMulticast({
      tokens: validTokens,
      notification: { title, body },
      data: data || {},
      webpush: {
        fcmOptions: { link: '/' },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: data?.tag || 'default',
          requireInteraction: true,
          actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        }
      }
    })
    
    if (response.failureCount > 0) {
      const failedTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          failedTokens.push(validTokens[idx])
        }
      })
      
      if (failedTokens.length > 0) {
        await db.collection('users').doc(userId).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
        })
        console.log('Removed ' + failedTokens.length + ' invalid tokens for user ' + userId)
      }
    }
    
    console.log('Sent notification to ' + response.successCount + '/' + validTokens.length + ' tokens for user ' + userId)
    return response.successCount
  } catch (error) {
    console.error('Error sending notification to user ' + userId + ':', error)
    return 0
  }
}

// ====================== HELPER FUNCTIONS FOR SNAPSHOTS ======================

async function createDailySnapshotForUser(userId: string, date: string) {
  const today = new Date(date)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const [onceSnap, recurringSnap] = await Promise.all([
    db.collection('tasks')
      .where('userId', '==', userId)
      .where('type', '==', 'once')
      .where('specificDate', '==', yesterdayStr)
      .get(),
    db.collection('tasks')
      .where('userId', '==', userId)
      .where('type', '==', 'recurring')
      .where('startDate', '<=', yesterdayStr)
      .where('endDate', '>=', yesterdayStr)
      .get(),
  ])

  interface TaskDoc {
    id: string
    title: string
    type: 'once' | 'recurring'
    status: string
    priority: 'main' | 'side'
  }

  const allTasks: TaskDoc[] = [
    ...onceSnap.docs.map(d => ({ id: d.id, ...d.data() } as TaskDoc)),
    ...recurringSnap.docs.map(d => ({ id: d.id, ...d.data() } as TaskDoc)),
  ]

  if (allTasks.length === 0) return

  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter(t => t.status === 'done').length
  const partialTasks = allTasks.filter(t => t.status === 'partial').length
  const mainCount = allTasks.filter(t => t.priority === 'main').length
  const sideCount = allTasks.filter(t => t.priority === 'side').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const tasks = allTasks.map(t => ({
    id: t.id,
    text: t.title,
    status: t.status === 'done' ? 'completed' : t.status === 'partial' ? 'partial' : 'not_done',
    priority: t.priority,
  }))

  await db.collection('dailyHistory').doc(userId + '_' + yesterdayStr).set({
    id: userId + '_' + yesterdayStr,
    userId,
    date: yesterdayStr,
    progress,
    mainCount,
    sideCount,
    totalTasks,
    completedTasks,
    partialTasks,
    tasks,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  console.log('Created daily snapshot for user ' + userId + ' date ' + yesterdayStr)
}