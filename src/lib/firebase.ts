import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const initializeFirebase = () => {
    if (getApps().length > 0) return getApp();
    return initializeApp(config);
};

const app = initializeFirebase();
export const auth = getAuth(app);
export const db = getFirestore(app);
