import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig'; 
import {  doc, updateDoc } from 'firebase/firestore';
export const fetchNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, 'employee', userId, 'notifications');
    const notificationSnapshot = await getDocs(notificationsRef);
    const notifications = notificationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};


export const markNotificationAsRead = async (userId, id) => {
  try {
    const notificationRef = doc(db, 'employee', userId, 'notifications', id);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};
