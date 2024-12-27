import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc,doc,setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import Modal from 'react-modal'; // For Modal Popup
import './AdminPanel.css';
import logo from '../../videoframe_logo.png';
import Header from '../Header';
import Navbar from '../Navbar';
import Swal from 'sweetalert2';
import ExportToExcel from '../ExportToExcel';

Modal.setAppElement('#root'); // for accessibility

const AdminPanel = () => {
  const [usersData, setUsersData] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchAllUsersData();
  }, []);

 const fetchAllUsersData = async () => {
    try {
      const employeesCollection = collection(db, 'employee');
      const employeeSnapshot = await getDocs(employeesCollection);
      const users = employeeSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(), // Include all user fields, such as displayName and department
      }));

      // Sort users alphabetically by displayName
      users.sort((a, b) => a.displayName.localeCompare(b.displayName));

      setUsersData(users);
      setFilteredUsers(users); 
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };
  
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = usersData.filter(user => 
      user.displayName.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setNotificationMessage('');
    setSelectedUser(null);
  };

  const sendNotification = async () => {
    if (!notificationMessage) return;

    try {
      const notificationRef = collection(db, 'employee', selectedUser.uid, 'notifications');
      await addDoc(notificationRef, {
        message: notificationMessage,
        read: false,
        timestamp: new Date()
      });
      Swal.fire({
        title: 'Success!',
        text: 'Message sent successfully',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      closeModal();
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  const updateDepartment = async (userId, department) => {
    if (!department) {
      Swal.fire('Error', 'Please select a department.', 'error');
      return;
    }
  
    try {
      const userRef = doc(db, 'employee', userId);
      await setDoc(userRef, { department }, { merge: true });
      Swal.fire('Success', 'Department updated successfully!', 'success');
      fetchAllUsersData(); // Refresh data to reflect changes
    } catch (error) {
      console.error('Error updating department:', error);
      Swal.fire('Error', 'Could not update department.', 'error');
    }
  };
  
  return (
    <>
       <Header />
      <div className='logoContainer'>
        <img src={logo} alt="Logo" className="logos" />
      </div>
      <Navbar />
      <main className='maincontainer'>
        <div className="users-table-container">
          <h2>Users Attendance List</h2>
          <ExportToExcel />

          {filteredUsers.length > 0 ? (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <thead>
                <tr>
                  <th></th>
                  <th>
                    <div className="search">
                      <input
                        type="text"
                        placeholder="Search by name"
                        value={searchQuery}
                        onChange={handleSearch}
                      />
                      <button type="submit" className="searchButton">
                        <FaSearch />
                      </button>
                    </div>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.uid}>
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/user-sessions/${user.uid}`} className="user-link">
                        {user.displayName || 'N/A'}
                      </Link>
                    </td>
                    <td>
                    <div className="search">
  <select 
    name="status" 
    value={user.department || ''} 
    onChange={(e) => updateDepartment(user.uid, e.target.value)}
  >
    <option value="">Select Department</option>
    <option value="OrciCare">OrciCare</option>
    <option value="UJustBe">UJustBe</option>
    <option value="Resigned">Resigned</option>
    <option value="Terminated">Terminated</option>
  </select>
</div>
</td>
                    <td>
                      <button className="m-button-6" onClick={() => openModal(user)}>Send Message</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="loader-container">
              <svg className="load" viewBox="25 25 50 50">
                <circle r="20" cy="50" cx="50"></circle>
              </svg>
            </div>
          )}
        </div>

        {/* Notification Modal */}
        <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Send Notification Modal" className="modal" overlayClassName="overlay">
          <h2>Send Message to {selectedUser?.displayName}</h2>
          <div className="form-group">
          <textarea
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder="Enter your message"
            className="notification-textarea"
          />
           <div className="btn-container">
          <button onClick={sendNotification} className="approve-btn">Send</button>
          <button onClick={closeModal} className="decline-btn">Cancel</button>
          </div>
          </div>
        </Modal>
        
      </main>
    </>
  );
};

export default AdminPanel;
