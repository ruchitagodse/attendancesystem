"use client"; // ✅ required in Next.js App Router for client-side hooks

import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { IoNotificationsOutline, IoNotifications } from "react-icons/io5";
import { format } from "date-fns";
import "../src/app/styles/page/_UserNotifications.scss";

const UserNotifications = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Track logged-in user
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // ✅ Listen for notifications from Firestore
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "employee", user.uid, "notifications");

    const unsubscribe = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const userNotifications = snapshot.docs.map((doc) => {
          const data = doc.data();
          const timestamp =
            data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : null;

          return {
            id: doc.id,
            ...data,
            timestamp,
          };
        });

        setNotifications(userNotifications);

        // Count unread
        const unread = userNotifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id) => {
    if (!user) return;
    try {
      const notificationRef = doc(db, "employee", user.uid, "notifications", id);
      await updateDoc(notificationRef, { read: true });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleBellClick = () => {
    setShowDropdown((prev) => !prev);
  };

  // ✅ Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bell-container">
      {showDropdown ? (
        <IoNotifications
          className="notification-icon"
          onClick={handleBellClick}
          title="View Notifications"
        />
      ) : (
        <IoNotificationsOutline
          className="notification-icon"
          onClick={handleBellClick}
          title="View Notifications"
        />
      )}

      {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}

      {showDropdown && (
        <div ref={dropdownRef} className="notifications-dropdown">
          <ul className="notifications-list">
            <h3 className="n-header">Notifications</h3>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={notification.read ? "read" : "unread"}
                >
                  <div className="notification-content">
                    <p>
                      <strong>{notification.message} </strong>
                      {notification.role}
                    </p>
                    <small>
                      {notification.timestamp
                        ? format(notification.timestamp, "dd/MM/yyyy HH:mm")
                        : "No date available"}
                    </small>
                  </div>
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)}>
                      Mark as Read
                    </button>
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
