import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { IoNotificationsOutline, IoNotifications } from 'react-icons/io5';
import { format } from 'date-fns';
import './UserNotifications.css';

const UserNotifications = () => {
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'employee', user.uid, 'notifications');

    // Listen to real-time updates using onSnapshot
    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      const userNotifications = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Check if timestamp exists and convert to JS Date object
        const timestamp = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : null;

        return {
          id: doc.id,
          ...data,
          timestamp, // Use the converted timestamp
        };
      });

      setNotifications(userNotifications);

      // Calculate unread notifications
      const unread = userNotifications.filter((notification) => !notification.read).length;
      setUnreadCount(unread);
    }, (error) => {
      console.error('Error fetching notifications:', error);
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const notificationRef = doc(db, 'employee', user.uid, 'notifications', id);
      await updateDoc(notificationRef, { read: true });
      
      // Update state to reflect changes
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleBellClick = () => {
    setShowDropdown((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bell-container">
      {showDropdown ? (
        <IoNotifications className="notification-icon" onClick={handleBellClick} title="View Notifications" />
      ) : (
        <IoNotificationsOutline className="notification-icon" onClick={handleBellClick} title="View Notifications" />
      )}

      {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}

      {showDropdown && (
        <div ref={dropdownRef} className="notifications-dropdown">
          <ul className="notifications-list">
            <h3 className="n-header">Notifications</h3>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <li key={notification.id} className={notification.read ? 'read' : 'unread'}>
                  <div className="notification-content">
                    <p>
                      <strong>{notification.message} </strong> {/* Replace with dynamic sender */}
                      {notification.role}
                    </p>
                    <small>{notification.timestamp ? format(notification.timestamp, 'dd/MM/yyyy HH:mm') : 'No date available'}</small> {/* Format the time */}
                  </div>
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)}>Mark as Read</button>
                  )}
                </li>
              ))
            ) : (
              <li>No notifications</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserNotifications;
