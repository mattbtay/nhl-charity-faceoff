import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config object goes here
  // You'll need to replace this with your actual Firebase configuration
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Helper functions for donation totals
export const subscribeToDonationTotals = (callback) => {
  console.log('Setting up Firestore subscription...');
  const teamsQuery = query(collection(db, 'teams'));
  return onSnapshot(teamsQuery, (snapshot) => {
    console.log('Received Firestore update:', snapshot.size, 'documents');
    const teams = {};
    snapshot.forEach((doc) => {
      console.log('Document data:', doc.id, doc.data());
      teams[doc.data().id] = doc.data();
    });
    console.log('Processed teams data:', teams);
    callback(teams);
  }, (error) => {
    console.error('Firestore subscription error:', error);
  });
};

export const updateDonationTotal = async (teamId, amount) => {
  try {
    console.log('Updating donation total for', teamId, 'to', amount);
    // First find the document with matching id field
    const teamsQuery = query(collection(db, 'teams'));
    const unsubscribe = onSnapshot(teamsQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.data().id === teamId) {
          console.log('Found document to update:', doc.id);
          updateDoc(doc.ref, {
            donationTotal: amount
          });
        }
      });
    });
    // Cleanup subscription right after update
    unsubscribe();
  } catch (error) {
    console.error('Error updating donation total:', error);
    throw error;
  }
};

export const initializeDonationTotals = async () => {
  const teams = {
    dallasStars: {
      name: 'Dallas Stars',
      donationTotal: 25750
    },
    coloradoAvalanche: {
      name: 'Colorado Avalanche',
      donationTotal: 28500
    }
  };
  
  try {
    const teamsRef = ref(database, 'teams');
    await set(teamsRef, teams);
  } catch (error) {
    console.error('Error initializing donation totals:', error);
    throw error;
  }
};

export default db; 