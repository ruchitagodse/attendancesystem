import React, { useState } from 'react';
import Modal from 'react-modal';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import './LeaveModal.css';
import { IoMdClose } from "react-icons/io";
import Swal from 'sweetalert2';
import emailjs from 'emailjs-com'; // Import EmailJS

Modal.setAppElement('#root'); // For accessibility

const LeaveModal = ({ isOpen, onRequestClose }) => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const user = useSelector((state) => state.auth.user);

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (!user) return;

    if (leaveType && startDate && endDate && reason) {
      try {
        // 1. Save leave request in Firestore under leaveRequests collection
        const leaveRequestsCollection = collection(db, 'leaveRequests');
        await addDoc(leaveRequestsCollection, {
          userId: user.uid,
          displayName: user.displayName || 'Anonymous',
          leaveType,
          startDate,
          endDate,
          reason,
          status: 'Pending',
          appliedDate: new Date().toISOString(),
        });

        // 2. Loop through each day in the date range and update user's session
        let currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
          const leaveDate = currentDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

          // 3. Path to the session document for the leave date
          const sessionDocRef = doc(db, "employee", user.uid, "sessions", leaveDate);

          // 4. Check if the session document exists
          const sessionDocSnap = await getDoc(sessionDocRef);

          if (sessionDocSnap.exists()) {
            // 5. If the session document exists, update the 'isOnLeave' field
            await setDoc(sessionDocRef, {
              isOnLeave: true,  // Mark the user as on leave
              leaveReason: reason, // Store the reason for leave
            }, { merge: true });
          } else {
            // 6. If no session exists for that day, create a new session document with isOnLeave
            await setDoc(sessionDocRef, {
              isOnLeave: true,
              leaveReason: reason,
            });
          }

          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // 7. Send email notification to HR using EmailJS
        emailjs.send(
          'service_r974ohe',
          'template_47oylcm',
          {
            user_name: user.displayName,
            user_email: user.email,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            reason: reason
          },
          'ALZM8KIHtWTmyOHJT'
        )
        .then((result) => {
          console.log('Email sent successfully:', result.text);
        })
        .catch((error) => {
          console.error('Email sending failed:', error.text);
        });

        // 8. Display success message
        Swal.fire({
          title: 'Success!',
          text: 'Your leave request has been submitted successfully, and a confirmation email has been sent!',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Clear form fields after submission
        setLeaveType('');
        setStartDate('');
        setEndDate('');
        setReason('');
        onRequestClose(); // Close modal after submission

      } catch (error) {
        console.error('Error applying for leave:', error);
        Swal.fire({
          title: 'Error!',
          text: 'There was an error submitting your leave request.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } else {
      Swal.fire({
        title: 'Incomplete Fields!',
        text: 'Please fill in all fields.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Apply for Leave"
      className="modal"
      overlayClassName="overlay"
    >
      <button className="close-modal" onClick={onRequestClose}><IoMdClose /></button>
      <h2>Apply for Leave</h2>
      <form onSubmit={handleApplyLeave}>
        <div className="leave-container">
          <div className="form-group">
            <label>Leave Type:<sup>*</sup></label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required 
            >
              <option value="" disabled>Select leave type</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="CompOff Leave">CompOff Leave</option>
              <option value="Half-Day Leave">Half-Day Leave</option>
              <option value="Forgot to Mark Attendance">Forgot to Mark Attendance</option>
            </select>
          </div>
          <div className="date-group">
            <div className="form-group">
              <label>Start Date:<sup>*</sup></label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date:<sup>*</sup></label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Reason:<sup>*</sup></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>
        </div>

        <div className="button-container">
          <button className="m-button-3 submit-btn" type="submit">
            Apply
          </button>
          <button className="m-button-4 submit-btn" type="button" onClick={onRequestClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveModal;
