import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; 
import logo from '../videoframe_logo.png';
import Swal from 'sweetalert2';
import './LeaveApplication.css';

const LeaveApplication = () => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();  

  const formatDateForFirestore = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault(); 
    
    if (!user) return;

    if (leaveType && startDate && endDate && reason) {
      try {
        const leaveRequestsCollection = collection(db, 'leaveRequests');
        await addDoc(leaveRequestsCollection, {
          userId: user.uid,
          displayName: user.displayName || 'Anonymous',
          leaveType,
          startDate: formatDateForFirestore(startDate),  // Store formatted start date
          endDate: formatDateForFirestore(endDate),      // Store formatted end date
          reason,
          status: 'Pending',
          appliedDate: new Date().toISOString(),
        });
    
        Swal.fire({
          title: 'Success!',
          text: 'Leave request submitted!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
    
        // Clear form fields after submission
        setLeaveType('');
        setStartDate('');
        setEndDate('');
        setReason('');
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

  const handleBack = () => {
    navigate(-1);  
  };

  return (
    <div className="leave-wrapper">
      <div className="leave">
        <div className="logos">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        
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
                <option value="Forgot to Mark Attendance">Forgot to Mark Attendance</option>
              </select>
            </div>

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

            <div className="form-group">
              <label>Reason:<sup>*</sup></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              ></textarea>
            </div>
          </div>

          {/* Button container */}
          <div className="button-container">
            <button className="buttons" type="submit">
              Apply 
              <svg fill="currentColor" viewBox="0 0 24 24" className="icon">
                <path
                  clipRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </button>
            <button className="back-button" onClick={handleBack}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveApplication;
