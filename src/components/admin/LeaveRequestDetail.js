import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import Modal from 'react-modal';
import './LeaveRequestDetail.css';
import logo from '../../videoframe_logo.png';
import Header from '../Header';
import Swal from 'sweetalert2';
import Navbar from '../Navbar';
import { Timestamp } from 'firebase/firestore'; 
import emailjs from 'emailjs-com'; // Import EmailJS SDK

const LeaveRequestDetail = () => {
  const { id } = useParams();
  const [leaveRequest, setLeaveRequest] = useState(null);
  const [employeeEmail, setEmployeeEmail] = useState(''); // Store employee email
  const [declineReason, setDeclineReason] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [declineModalIsOpen, setDeclineModalIsOpen] = useState(false);
  const [approvalModalIsOpen, setApprovalModalIsOpen] = useState(false);

  useEffect(() => {
    emailjs.init('ALZM8KIHtWTmyOHJT');  // Replace 'your_public_key' with the actual public key
  }, []);

  useEffect(() => {
    const fetchLeaveRequestDetail = async () => {
      try {
        console.log('Fetching leave request details...');
        const docRef = doc(db, 'leaveRequests', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Leave request data:', data);
          setLeaveRequest(data);

          const employeeRef = doc(db, 'employee', data.userId);
          const employeeSnap = await getDoc(employeeRef);
          if (employeeSnap.exists()) {
            setEmployeeEmail(employeeSnap.data().email); // Assuming email is in 'email' field
            console.log('Employee email:', employeeSnap.data().email);
          } else {
            console.error('Employee not found with this userId');
          }
        } else {
          console.error('Leave request not found');
        }
      } catch (error) {
        console.error('Error fetching leave request:', error);
      }
    };

    fetchLeaveRequestDetail();
  }, [id]);

  const openDeclineModal = () => {
    console.log('Opening decline modal...');
    setDeclineModalIsOpen(true);
  };

  const closeDeclineModal = () => {
    console.log('Closing decline modal...');
    setDeclineModalIsOpen(false);
  };

  const openApprovalModal = () => {
    console.log('Opening approval modal...');
    setApprovalModalIsOpen(true);
  };

  const closeApprovalModal = () => {
    console.log('Closing approval modal...');
    setApprovalModalIsOpen(false);
  };

  const handleUpdateLeaveStatus = (status) => {
    console.log(`Handling leave status: ${status}`);
    if (status === 'Declined') {
      openDeclineModal();
    } else {
      openApprovalModal();
    }
  };

  const handleDecline = async () => {
    const adminAction = {
      status: 'Denied', // Admin's decision
      reason: declineReason, // Admin's reason for denial
    };
  
    try {
      const leaveRequestRef = doc(db, 'leaveRequests', id);
      await updateDoc(leaveRequestRef, { status: 'Declined', adminReason: declineReason });
      setLeaveRequest((prev) => ({ ...prev, status: 'Declined', adminReason: declineReason }));
  
      // Send notification to the user
      const notificationRef = collection(db, 'employee', leaveRequest.userId, 'notifications');
      await addDoc(notificationRef, {
        message: `Your leave request has been denied. Reason: ${declineReason}`,
        timestamp: new Date(),
        read: false,
        reason: declineReason,
      });
  
      // Send email with admin's action and reason
      await sendEmail(employeeEmail, leaveRequest, adminAction);
  
      Swal.fire({
        title: 'Success!',
        text: 'Leave Denied successfully.Mail has been sent.',
        icon: 'success',
        confirmButtonText: 'OK',
      });
      closeDeclineModal();
    } catch (error) {
      console.error('Error handling denial:', error);
    }
  };
  
  const handleApproval = async () => {
    const adminAction = {
      status: 'Approved', // Admin's decision
      reason: approvalReason, // Admin's reason for approval
    };
  
    try {
      // Fetch the admin's role (assuming `adminEmail` is the email of the admin performing the action)
      const adminRef = doc(db, 'users', 'email'); // You may need to replace this with the actual admin's UID or email
      const adminSnap = await getDoc(adminRef);
  
      let adminRole = 'HR'; // Default role
      if (adminSnap.exists()) {
        adminRole = adminSnap.data().role; // Assuming the role is stored in 'role' field
      }
  
      const leaveRequestRef = doc(db, 'leaveRequests', id);
      await updateDoc(leaveRequestRef, { status: 'Approved', adminReason: approvalReason });
      setLeaveRequest((prev) => ({ ...prev, status: 'Approved', adminReason: approvalReason }));
  
      // Send notification to the user
      const notificationRef = collection(db, 'employee', leaveRequest.userId, 'notifications');
      await addDoc(notificationRef, {
        message: `Your leave request has been approved. Reason: ${approvalReason}`,
        timestamp: new Date(),
        read: false,
        reason: approvalReason,
      });
  
      // Send email with admin's action, reason, and role
      await sendEmail(employeeEmail, leaveRequest, adminAction, adminRole);
  
      Swal.fire({
        title: 'Success!',
        text: 'Leave approved successfully. Mail has been sent.',
        icon: 'success',
        confirmButtonText: 'OK',
      });
      closeApprovalModal();
    } catch (error) {
      console.error('Error handling approval:', error);
    }
  };
  
  
  
  const sendEmail = async (userEmail, leaveRequest, adminAction, adminRole) => {
    try {
      const templateParams = {
        to_email: userEmail,
        reply_to: userEmail,
        user_name: leaveRequest.displayName || 'Employee', // User's name
        status: adminAction.status, // Admin's decision: "Approved" or "Denied"
        admin_reason: adminAction.reason, // Admin's reason for approval/denial
        leaveType: leaveRequest.leaveType, // Type of leave (sick, vacation, etc.)
        reason: leaveRequest.reason, // User's reason for leave
        startDate: formatDate(leaveRequest.startDate), // Start date of leave
        endDate: formatDate(leaveRequest.endDate), // End date of leave
        appliedDate: formatDate(leaveRequest.appliedDate), // Date when leave was applied
        approved_by: 'HR', // Admin role: "Admin" or "HR"
      };
  
      // Sending the email via EmailJS
      const response = await emailjs.send('service_r974ohe', 'template_ivmo5uy', templateParams);
      console.log('Email sent successfully:', response);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  
  
  
  

  const formatDate = (timestamp) => {
    console.log('Formatting date...');
    let date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (!leaveRequest) {
    console.log('Loading leave request data...');
    return (
      <div className="loader-container">
        <svg className="load" viewBox="25 25 50 50">
          <circle r="20" cy="50" cx="50" />
        </svg>
      </div>
    );
  }

  console.log('Leave request data loaded:', leaveRequest);

  return (
    <>
      <Header />
      <div className="logoContainer">
        <img src={logo} alt="Logo" className="logos" />
      </div>
      <Navbar />
      <main className="maincontainer">
        <div className="leave-requests-container">
          <div className="leave-container">
            <h2>Leave Request Details</h2>
            <button className="m-button-5" onClick={() => window.history.back()}>
              Back
            </button>
            <div className="leave-request">
              <p><strong>Name:</strong> {leaveRequest.displayName}</p>
              <p><strong>Start Date:</strong> {formatDate(leaveRequest.startDate)}</p>
              <p><strong>End Date:</strong> {formatDate(leaveRequest.endDate)}</p>
              <p><strong>Leave Type:</strong> {leaveRequest.leaveType}</p>
              <p><strong>Reason:</strong> {leaveRequest.reason}</p>
              <p><strong>Status:</strong> {leaveRequest.status}</p>
              <p><strong>Remark:</strong> {leaveRequest.adminReason}</p>
            </div>

            {leaveRequest.status === 'Pending' && (
              <div className="btn-container">
                <button className="approve-btn" onClick={() => handleUpdateLeaveStatus('Approved')}>
                  Approve
                </button>
                <button className="decline-btn" onClick={() => handleUpdateLeaveStatus('Declined')}>
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal 
        isOpen={declineModalIsOpen} 
        onRequestClose={closeDeclineModal} 
        contentLabel="Decline Reason" 
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Decline Reason</h2>
        <div className='form-group'>
        <textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          placeholder="Enter decline reason"
        />
              <div className="btn-container">
        <button className="approve-btn" onClick={handleDecline}>
          Submit
        </button>
        <button className="decline-btn" onClick={closeDeclineModal}>
          Cancel
        </button>
        </div>
        </div>
      </Modal>

      <Modal 
        isOpen={approvalModalIsOpen} 
        onRequestClose={closeApprovalModal} 
        contentLabel="Approval Reason"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Approval Reason</h2>
        <div className='form-group'>
        <textarea
          value={approvalReason}
          onChange={(e) => setApprovalReason(e.target.value)}
          placeholder="Enter approval reason"
        />
         <div className="btn-container">
        <button className="approve-btn" onClick={handleApproval}>
          Submit
        </button>
        <button className="decline-btn" onClick={closeApprovalModal}>
          Cancel
        </button>
        </div>
        </div>
      </Modal>
    </>
  );
};

export default LeaveRequestDetail;
