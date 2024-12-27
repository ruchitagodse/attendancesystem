import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Ensure you have the correct Firebase configuration
import { getAuth } from 'firebase/auth'; // Import Firebase Auth
import logo from '../../videoframe_logo.png'; // Update logo path accordingly
import Header from '../Header'; // Assuming you have these components in your project
import Navbar from '../Navbar'; // Update the import paths as per your project structure

const AnnouncementForm = () => {
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState(''); // For handling errors
  const [successMessage, setSuccessMessage] = useState(''); // For success feedback
  const [createdBy, setCreatedBy] = useState(''); // Store the name of the user who created the announcement
  const [role, setRole] = useState(''); // Store the role of the user

  // Fetch the current user's display name and role
  useEffect(() => {
    const auth = getAuth(); // Get the Firebase Auth instance
    const user = auth.currentUser; // Get the current user

    if (user) {
      setCreatedBy(user.email); // Use user's email or user.displayName if available

      // Fetch the user's role from the Firestore users collection
      const fetchUserRole = async () => {
        const userDocRef = doc(db, 'users', user.uid); // Assuming user.uid is the document ID
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role); // Fetch role from the user's document
        } else {
          console.error('User document does not exist');
        }
      };

      fetchUserRole();
    }
  }, []);

  // Handle input change
  const handleAnnouncementChange = (e) => {
    setAnnouncement(e.target.value);
    setError(''); // Clear the error message
  };

  const sendAnnouncement = async () => {
    if (!announcement) {
      setError('Please enter an announcement before sending');
      return;
    }
  
    try {
      const timestamp = new Date();
  
      // Add the announcement to the global 'announcements' collection
      const announcementRef = await addDoc(collection(db, 'announcements'), {
        message: announcement,
        timestamp,
        createdBy: createdBy || 'Unknown Admin',
        role: role || 'Unknown Role',
      });
  
      // Fetch all users from the 'employee' collection
      const employeesCollection = collection(db, 'employee');
      const employeeSnapshot = await getDocs(employeesCollection);
  
      const promises = employeeSnapshot.docs.map((doc) => {
        // Add notification to each employee's notifications subcollection
        return addDoc(collection(db, 'employee', doc.id, 'notifications'), {
          announcementId: announcementRef.id,
          message: announcement,
          read: false,
          timestamp, // Include timestamp for the notification
          role: role || 'Unknown Role', // Include role of the announcement creator
        });
      });
  
      // Wait for all notification promises to resolve
      await Promise.all(promises);
  
      setAnnouncement('');
      setSuccessMessage('Announcement sent to all users');
  
    } catch (error) {
      console.error('Error sending announcement:', error);
      setError('Failed to send announcement. Please try again.');
    }
  };
  
  return (
    <>
      {/* Header and Navbar components */}
      <Header />
      <div className="logoContainer">
        <img src={logo} alt="Logo" className="logos" />
      </div>
      <Navbar />
      
      {/* Main Content */}
      <main className="maincontainer">
        <div className="leave-requests-container">
          <div className="leave-container">
            <h2>Send Announcement</h2>
            <button className="m-button-5" onClick={() => window.history.back()}>
              Back
            </button>

            {/* Input Text Area for Announcement */}
            <div className="form-group">
              <textarea
                value={announcement}
                onChange={handleAnnouncementChange}
                placeholder="Enter your announcement"
              />
              {/* Show error if any */}
              {error && <p style={{ color: 'red' }}>{error}</p>}
              {/* Show success message if announcement is sent */}
              {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            </div>

            {/* Button to Send Announcement */}
            <button className="m-button" onClick={sendAnnouncement}>Send</button>
          </div>
        </div>
        
      </main>
    </>
  );
};

export default AnnouncementForm;
