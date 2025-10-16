"use client";

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import "../src/app/styles/page/_LeaveModal.scss";
import { IoMdClose } from "react-icons/io";
import Swal from 'sweetalert2';
import emailjs from 'emailjs-com';

Modal.setAppElement('body'); // ✅ Next.js compatible

const LeaveModal = ({ isOpen, onRequestClose }) => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // ✅ Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!user) {
      Swal.fire("Error", "You must be logged in to apply for leave.", "error");
      setIsSubmitting(false);
      return;
    }

    if (!(leaveType && startDate && endDate && reason)) {
      Swal.fire("Incomplete Fields!", "Please fill in all fields.", "warning");
      setIsSubmitting(false);
      return;
    }

    try {
      // 🔹 1. Query employee by email
      const q = query(
        collection(db, "employeeDetails"),
        where("personalInfo.email", "==", user.email)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Swal.fire("Error", "Employee record not found.", "error");
        setIsSubmitting(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const personalInfo = userDoc.data().personalInfo || {};
      const phoneNumber = personalInfo.mobile;
      const employeeName = personalInfo.name || "Unknown";
      const employeeEmail = personalInfo.email || "";
      const teamLeadEmail = personalInfo.teamLeadEmail || "";
      const hrEmail = "charuta.agate@ujustbe.com";

      // 🔹 2. Save leave request in Firestore
      const leaveRequestsCollection = collection(db, "leaveRequest");
      await addDoc(leaveRequestsCollection, {
        userId: phoneNumber,
        displayName: employeeName,
        email: employeeEmail,
        leaveType,
        startDate,
        endDate,
        reason,
        status: "Pending",
        appliedDate: new Date().toISOString(),
      });

      // 🔹 3. Mark leave inside sessions
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const leaveDate = currentDate.toISOString().split("T")[0];
        const sessionDocRef = doc(db, "employeeDetails", phoneNumber, "sessions", leaveDate);

        await setDoc(
          sessionDocRef,
          { isOnLeave: true, leaveReason: reason },
          { merge: true }
        );

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 🔹 4. Send email via EmailJS
      await emailjs.send(
        "service_v5827cr",       // your service ID
        "template_jxut3o3",      // your template ID
        {
          to_email: teamLeadEmail || hrEmail, // if no TL, send directly to HR
          cc_email: hrEmail,
          user_name: employeeName,
          user_email: employeeEmail,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
        },
        "R_wJ5sjeOto5umMKf"      // your public key
      );

      Swal.fire(
        "Success!",
        "Your leave request has been submitted successfully. The team lead and HR have been notified.",
        "success"
      );

      // ✅ Reset form
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setReason("");
      onRequestClose();

    } catch (error) {
      console.error("Error applying for leave:", error);
      Swal.fire("Error!", "There was an error submitting your leave request.", "error");
    } finally {
      setIsSubmitting(false);
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
          <button 
            className="m-button-3 submit-btn"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Applying..." : "Apply"}
          </button>
          <button
            className="m-button-4 submit-btn"
            type="button"
            onClick={onRequestClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveModal;
