import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Generic function to sync state with Firestore document in real-time
export function subscribeToDoc<T>(
  docKey: string,
  onData: (data: T) => void,
  initialValue: T
) {
  const docRef = doc(db, 'app_data', docKey);
  
  // Listen for real-time updates
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && 'value' in data) {
        onData(data.value as T);
      }
    } else {
      // First time initialization in Firestore
      setDoc(docRef, { value: initialValue, updatedAt: new Date().toISOString() })
        .catch(err => console.error(`Error initializing Firestore for ${docKey}:`, err));
      onData(initialValue);
    }
  }, (error) => {
    console.error(`Error in Firestore subscription for ${docKey}:`, error);
  });

  return unsubscribe;
}

// Function to update state in Firestore, triggering real-time sync across all devices
export async function updateDocValue<T>(docKey: string, value: T) {
  try {
    const docRef = doc(db, 'app_data', docKey);
    await setDoc(docRef, { value, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error(`Error updating Firestore for ${docKey}:`, error);
  }
}
