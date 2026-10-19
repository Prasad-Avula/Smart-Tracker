import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  type User as FirebaseUser
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  type DocumentReference 
} from 'firebase/firestore'
import { auth, db } from '@firebase-local/index'
import { type User, type UserSettings, DEFAULT_USER_SETTINGS } from '../types'
import { UUID } from '@shared/types'

const USERS_COLLECTION = 'users'

export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signupUser(email: string, password: string, displayName: string): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  // Update profile with display name
  await updateProfile(userCredential.user, { displayName })
  
  // Create user document in Firestore
  await createUserDocument(userCredential.user.uid, email, displayName)
  
  return userCredential.user
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function createUserDocument(
  uid: string, 
  email: string, 
  displayName: string,
  settings?: Partial<UserSettings>
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid) as DocumentReference<User>
  const userData: User = {
    id: uid as UUID,
    email,
    displayName,
    settings: { ...DEFAULT_USER_SETTINGS, ...settings },
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function getUserDocument(uid: string): Promise<User | null> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  const userSnap = await getDoc(userRef)
  
  if (!userSnap.exists()) return null
  
  const data = userSnap.data()
  return {
    ...data,
    id: userSnap.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  } as User
}

export async function getOrCreateUserDocument(uid: string): Promise<User> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const data = userSnap.data()
    return {
      ...data,
      id: userSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as User
  }

  // Document doesn't exist - create it from Firebase Auth user
  const authUser = auth.currentUser
  if (authUser && authUser.uid === uid) {
    const userData: User = {
      id: uid as UUID,
      email: authUser.email || '',
      displayName: authUser.displayName || '',
      settings: DEFAULT_USER_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return userData
  }

  throw new Error('Unable to create user document')
}

export async function updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  await updateDoc(userRef, {
    settings,
    updatedAt: serverTimestamp()
  })
}

export async function updateUserProfile(uid: string, data: { displayName?: string; photoURL?: string }): Promise<void> {
  const user = auth.currentUser
  if (user) {
    await updateProfile(user, data)
  }
  
  const userRef = doc(db, USERS_COLLECTION, uid)
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export async function deleteUserAccount(uid: string): Promise<void> {
  // Delete user document from Firestore
  const userRef = doc(db, USERS_COLLECTION, uid)
  await deleteDoc(userRef)
  
  // Delete Firebase Auth user
  const user = auth.currentUser
  if (user && user.uid === uid) {
    await deleteUser(user)
  }
}

// Combined service object for convenience
export const authService = {
  loginUser,
  signupUser,
  logoutUser,
  resetPassword,
  createUserDocument,
  getUserDocument,
  getOrCreateUserDocument,
  updateUserSettings,
  updateUserProfile,
}
