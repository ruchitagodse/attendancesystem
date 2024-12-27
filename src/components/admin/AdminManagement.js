import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import Navbar from '../Navbar';
import logo from '../../videoframe_logo.png';
import Header from '../Header';


const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    const fetchAdminsAndHRs = async () => {
      try {
        // Fetch users with roles 'admin' or 'HR'
        const q = query(
          collection(db, 'users'), 
          where('role', 'in', ['Admin', 'HR']) // Firestore allows filtering by array for specific roles
        );
        
        const querySnapshot = await getDocs(q);
        const adminList = querySnapshot.docs.map(doc => ({
          id: doc.id, // Document ID
          ...doc.data()
        }));
        
        setAdmins(adminList);
      } catch (error) {
        console.error('Error fetching admins and HRs:', error);
      }
    };

    fetchAdminsAndHRs();
  }, []);

  // Function to delete a user based on their unique document ID
  const handleDelete = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setAdmins((prevAdmins) => prevAdmins.filter(admin => admin.id !== userId));

      Swal.fire({
        title: 'Deleted!',
        text: 'User has been deleted successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete user.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
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
        <div className="leave-requests-container">
      <h2>Admin & HR Management</h2>
      <button className="m-button-5" onClick={() => window.history.back()}>
                Back
            </button>
            <table className="leave-requests-table">
                
        <thead>
          <tr>
           
           
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
             
              <td>{admin.email || 'N/A'}</td>
              <td>{admin.role}</td>
              {/* <td>{admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td> */}
              <td>
                <button className='m-button-7' onClick={() => handleDelete(admin.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </main>
    </>
  );
};

export default AdminManagement;
