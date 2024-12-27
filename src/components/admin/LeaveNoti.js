import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig'; // Adjust according to your Firebase setup
import { collection, getDocs, query, where } from 'firebase/firestore';

const LeaveRequestNotifications = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const leaveRequestsRef = collection(db, 'leaveRequests'); // Adjust collection name
        const q = query(leaveRequestsRef, where('status', '==', 'pending')); // Adjust field name
        const querySnapshot = await getDocs(q);
        
        setPendingCount(querySnapshot.size); // Count pending requests
      } catch (error) {
        console.error("Error fetching leave requests: ", error);
      }
    };

    fetchPendingRequests();
  }, []);

  return (
    pendingCount > 0 && (
      <span className="notification-badge">{pendingCount}</span>
    )
  );
};

export default LeaveRequestNotifications;
