import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug: Log config values (excluding sensitive data)
console.log('Firebase Config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

// Initialize Firebase only if it hasn't been initialized already
let app;
try {
  if (!firebaseConfig.projectId) {
    throw new Error('Firebase project ID is missing. Check environment variables.');
  }
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

const db = getFirestore(app);

// Helper function for donation totals
export const subscribeToDonationTotals = (callback) => {
  try {
    console.log('Setting up Firestore subscription...');
    const teamsQuery = query(collection(db, 'teams'));
    return onSnapshot(teamsQuery, 
      (snapshot) => {
        console.log('Received Firestore update:', snapshot.size, 'documents');
        const teams = {};
        snapshot.forEach((doc) => {
          console.log('Processing document:', doc.id, doc.data());
          teams[doc.data().id] = doc.data();
        });
        console.log('Processed teams data:', teams);
        callback(teams);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        // In case of error, use initial data
        callback({});
      }
    );
  } catch (error) {
    console.error('Error setting up Firestore subscription:', error);
    // In case of error, use initial data
    callback({});
    return () => {}; // Return no-op cleanup function
  }
};

export default db; 