import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Header from '../Header';
import logo from '../../videoframe_logo.png';
import Swal from 'sweetalert2';
import Navbar from '../Navbar';

const ListAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [editing, setEditing] = useState(null); // Track the announcement being edited
  const [editMessage, setEditMessage] = useState('');

  // Fetch all announcements from Firestore
  const fetchAnnouncements = async () => {
    try {
      const announcementCollection = collection(db, 'announcements');
      const snapshot = await getDocs(announcementCollection);
      const announcementList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAnnouncements(announcementList);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Delete Announcement from both global and users' notifications
  const deleteAnnouncement = async (announcementId) => {
    try {
      // Delete announcement from global collection
      await deleteDoc(doc(db, 'announcements', announcementId));

      // Update UI
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));

      // Also remove the announcement from each user's notifications
      await deleteAnnouncementFromUsers(announcementId);

       Swal.fire({
          title: 'Success!',
          text: 'Announcement Deleted successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  // Delete the announcement from each user's notifications
  const deleteAnnouncementFromUsers = async (announcementId) => {
    try {
      const usersCollection = collection(db, 'employee');
      const usersSnapshot = await getDocs(usersCollection);

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const notificationsCollection = collection(db, 'employee', userDoc.id, 'notifications');
        const notificationSnapshot = await getDocs(notificationsCollection);

        notificationSnapshot.docs.forEach(async (notifDoc) => {
          if (notifDoc.data().announcementId === announcementId) {
            await deleteDoc(doc(db, 'employee', userDoc.id, 'notifications', notifDoc.id));
          }
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error deleting user notifications:', error);
    }
  };

  // Handle editing the announcement
  const startEdit = (announcement) => {
    setEditing(announcement.id);
    setEditMessage(announcement.message);
  };

  const saveEdit = async (announcementId) => {
    try {
      const announcementRef = doc(db, 'announcements', announcementId);

      // Update the message in the global collection
      await updateDoc(announcementRef, { message: editMessage });

      // Also update the message in each user's notifications
      await updateAnnouncementInUsers(announcementId, editMessage);

      // Update UI
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId ? { ...a, message: editMessage } : a
        )
      );

      setEditing(null); // Close editing mode
      alert('Announcement updated successfully!');
    } catch (error) {
      console.error('Error updating announcement:', error);
    }
  };

  // Update the announcement in each user's notifications
  const updateAnnouncementInUsers = async (announcementId, newMessage) => {
    try {
      const usersCollection = collection(db, 'employee');
      const usersSnapshot = await getDocs(usersCollection);

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const notificationsCollection = collection(db, 'employee', userDoc.id, 'notifications');
        const notificationSnapshot = await getDocs(notificationsCollection);

        notificationSnapshot.docs.forEach(async (notifDoc) => {
          if (notifDoc.data().announcementId === announcementId) {
            await updateDoc(doc(db, 'employee', userDoc.id, 'notifications', notifDoc.id), {
              message: newMessage,
            });
          }
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating user notifications:', error);
    }
  };

  return (
    <>
      <Header />
      <div className='logoContainer'>
      <img src={logo} alt="Logo" className="logos" />
    </div>
      <Navbar />
      <div className="maincontainer">
      <div className="leave-requests-container">
        <h2>List of Announcements</h2>
        <button className="m-button-5" onClick={() => window.history.back()}>
            Back
          </button>
          <table className="leave-requests-table">
          <thead>
            <tr>
              <th>Message</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>

            {announcements.map((announcement) => (
              <tr key={announcement.id}>
                
                <td>
                  {editing === announcement.id ? (
                    <input
                      type="text"
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                    />
                  ) : (
                    announcement.message
                  )}
                </td>
                <td>{new Date(announcement.timestamp.toDate()).toLocaleString()}</td>
                <td>
                  {editing === announcement.id ? (
                    <button className='m-button-7' onClick={() => saveEdit(announcement.id)}>Save</button>
                  ) : (
                    
                    <div class="btn-container">
                      <button className='m-button-6' onClick={() => startEdit(announcement)}>Edit</button>
                      <button className='m-button-6' onClick={() => deleteAnnouncement(announcement.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
};

export default ListAnnouncements;
