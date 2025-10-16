'use client';
import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Modal from 'react-modal';
import Header from '../../component/Header';
import Navbar from '../../component/Navbar';
import Swal from 'sweetalert2';
import emailjs from 'emailjs-com';
import logo from '../../public/videoframe_logo.png';
import '../../src/app/styles/page/_LeaveDetails.scss';
import "../../src/app/styles/main.scss";

const LeaveRequestDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  const [leaveRequest, setLeaveRequest] = useState(null);
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [declineModalIsOpen, setDeclineModalIsOpen] = useState(false);
  const [approvalModalIsOpen, setApprovalModalIsOpen] = useState(false);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('ALZM8KIHtWTmyOHJT'); // replace with your public key
  }, []);

  // Fetch leave request details
  useEffect(() => {
    if (!id) return;

    const fetchLeaveRequestDetail = async () => {
      try {
        const docRef = doc(db, 'leaveRequest', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setLeaveRequest(data);

          // Use email from leave request if available
          if (data.email) {
            setEmployeeEmail(data.email);
          } else {
            // fallback to employeeDetails collection
            const employeeRef = doc(db, 'employeeDetails', data.userId);
            const employeeSnap = await getDoc(employeeRef);
            if (employeeSnap.exists()) {
              setEmployeeEmail(employeeSnap.data().email || '');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leave request:', error);
      }
    };

    fetchLeaveRequestDetail();
  }, [id]);

  const openDeclineModal = () => setDeclineModalIsOpen(true);
  const closeDeclineModal = () => setDeclineModalIsOpen(false);
  const openApprovalModal = () => setApprovalModalIsOpen(true);
  const closeApprovalModal = () => setApprovalModalIsOpen(false);

  const handleUpdateLeaveStatus = (status) => {
    status === 'Declined' ? openDeclineModal() : openApprovalModal();
  };

  const handleDecline = async () => {
    if (!employeeEmail) {
      Swal.fire('Error', 'Cannot send email: employee email is missing', 'error');
      return;
    }

    try {
      const leaveRequestRef = doc(db, 'leaveRequest', id);
      await updateDoc(leaveRequestRef, { status: 'Declined', adminReason: declineReason });
      setLeaveRequest(prev => ({ ...prev, status: 'Declined', adminReason: declineReason }));

      const notificationRef = collection(db, 'employeeDetails', leaveRequest.userId, 'notifications');
      await addDoc(notificationRef, {
        message: `Your leave request has been denied. Reason: ${declineReason}`,
        timestamp: new Date(),
        read: false,
        reason: declineReason,
      });

      await sendEmail(employeeEmail, leaveRequest, { status: 'Declined', reason: declineReason });

      Swal.fire('Success!', 'Leave Denied successfully. Mail has been sent.', 'success');
      closeDeclineModal();
    } catch (error) {
      console.error('Error handling denial:', error);
      Swal.fire('Error', 'Failed to decline leave request', 'error');
    }
  };

  const handleApproval = async () => {
    if (!employeeEmail) {
      Swal.fire('Error', 'Cannot send email: employee email is missing', 'error');
      return;
    }

    try {
      const leaveRequestRef = doc(db, 'leaveRequest', id);
      await updateDoc(leaveRequestRef, { status: 'Approved', adminReason: approvalReason });
      setLeaveRequest(prev => ({ ...prev, status: 'Approved', adminReason: approvalReason }));

      const notificationRef = collection(db, 'employeeDetails', leaveRequest.userId, 'notifications');
      await addDoc(notificationRef, {
        message: `Your leave request has been approved. Reason: ${approvalReason}`,
        timestamp: new Date(),
        read: false,
        reason: approvalReason,
      });

      await sendEmail(employeeEmail, leaveRequest, { status: 'Approved', reason: approvalReason });

      Swal.fire('Success!', 'Leave approved successfully. Mail has been sent.', 'success');
      closeApprovalModal();
    } catch (error) {
      console.error('Error handling approval:', error);
      Swal.fire('Error', 'Failed to approve leave request', 'error');
    }
  };

  const sendEmail = async (userEmail, leaveRequest, adminAction) => {
    if (!userEmail) {
      console.error('No recipient email provided. Email not sent.');
      return;
    }

    const templateParams = {
      to_email: userEmail,
      reply_to: userEmail,
      user_name: leaveRequest.displayName || 'Employee',
      status: adminAction.status,
      admin_reason: adminAction.reason,
      leaveType: leaveRequest.leaveType,
      reason: leaveRequest.reason,
      startDate: formatDate(leaveRequest.startDate),
      endDate: formatDate(leaveRequest.endDate),
      appliedDate: leaveRequest.appliedDate ? formatDate(leaveRequest.appliedDate) : 'N/A',
      approved_by: 'HR',
    };

    try {
      await emailjs.send('service_r974ohe', 'template_ivmo5uy', templateParams);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (!leaveRequest) {
    return (
      <div className="loader-container">
        <svg className="load" viewBox="25 25 50 50">
          <circle r="20" cy="50" cx="50" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <Header />
   
      <Navbar />
      <main className="maincontainer">
        <div className="leave-requests-container">
          <div className="leave-container">
            <h2>Leave Request Details</h2>
            <button className="m-button-5" onClick={() => router.back()}>Back</button>

            <div className="leave-request">
              <p><strong>Name:</strong> {leaveRequest.displayName}</p>
              <p><strong>Start Date:</strong> {formatDate(leaveRequest.startDate)}</p>
              <p><strong>End Date:</strong> {formatDate(leaveRequest.endDate)}</p>
              <p><strong>Applied Date:</strong> {leaveRequest.appliedDate ? formatDate(leaveRequest.appliedDate) : 'N/A'}</p>
              <p><strong>Leave Type:</strong> {leaveRequest.leaveType}</p>
              <p><strong>Reason:</strong> {leaveRequest.reason}</p>
              <p><strong>Status:</strong> {leaveRequest.status}</p>
              <p><strong>Remark:</strong> {leaveRequest.adminReason || 'N/A'}</p>
            </div>

            {leaveRequest.status === 'Pending' && (
              <div className="btn-container">
                <button className="approve-btn" onClick={() => handleUpdateLeaveStatus('Approved')}>Approve</button>
                <button className="decline-btn" onClick={() => handleUpdateLeaveStatus('Declined')}>Decline</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Decline Modal */}
      <Modal isOpen={declineModalIsOpen} onRequestClose={closeDeclineModal} contentLabel="Decline Reason" className="modal" overlayClassName="overlay">
        <h2>Decline Reason</h2>
        <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Enter decline reason" />
        <div className="btn-container">
          <button className="approve-btn" onClick={handleDecline}>Submit</button>
          <button className="decline-btn" onClick={closeDeclineModal}>Cancel</button>
        </div>
      </Modal>

      {/* Approval Modal */}
      <Modal isOpen={approvalModalIsOpen} onRequestClose={closeApprovalModal} contentLabel="Approval Reason" className="modal" overlayClassName="overlay">
        <h2>Approval Reason</h2>
        <textarea value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} placeholder="Enter approval reason" />
        <div className="btn-container">
          <button className="approve-btn" onClick={handleApproval}>Submit</button>
          <button className="decline-btn" onClick={closeApprovalModal}>Cancel</button>
        </div>
      </Modal>
    </>
  );
};

export default LeaveRequestDetail;
