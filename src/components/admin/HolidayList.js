import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import Header from '../Header';
import Navbar from '../Navbar';
import logo from '../../videoframe_logo.png';

Modal.setAppElement('#root');

const HolidayList = () => {
  const [holidays, setHolidays] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const departments = ['UJustBe', 'OrciCare']; // Add more departments if needed

  useEffect(() => {
    fetchHolidayList();
  }, []);

  // Fetch Holidays from Firestore
  const fetchHolidayList = async () => {
    try {
      const holidaysCollection = collection(db, 'holidays');
      const holidaySnapshot = await getDocs(holidaysCollection);
      const holidayData = holidaySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHolidays(holidayData);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  // Add Holiday to Firestore
  const addHoliday = async () => {
    if (!holidayName || !holidayDate || selectedDepartments.length === 0) {
      Swal.fire('Error', 'Please fill all fields and select at least one department', 'error');
      return;
    }

    try {
      const holidaysCollection = collection(db, 'holidays');
      await addDoc(holidaysCollection, {
        name: holidayName,
        date: holidayDate,
        departments: selectedDepartments
      });
      Swal.fire('Success', 'Holiday added successfully', 'success');
      setModalIsOpen(false);
      fetchHolidayList();
      resetForm();
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  };

  const resetForm = () => {
    setHolidayName('');
    setHolidayDate('');
    setSelectedDepartments([]);
  };

  const toggleDepartment = (department) => {
    setSelectedDepartments((prev) =>
      prev.includes(department)
        ? prev.filter((d) => d !== department)
        : [...prev, department]
    );
  };

  return (
    <>
    <Header />
    <div className="logoContainer">
        <img src={logo} alt="Logo" className="logos" />
    </div>
    <Navbar />
    <main className="maincontainer">
        <div className="users-table-container">
        <h2>Holiday List</h2>
           
      
        <button className="m-button-5" onClick={() => setModalIsOpen(true)} >
        Add
      </button>
      {/* Holiday Table */}
      {holidays.length > 0 ? (
        <table className="users-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Date</th>
              <th>Holiday Name</th>
              <th>Departments</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday, index) => (
              <tr key={holiday.id}>
                <td>{index + 1}</td>
                <td>{holiday.date}</td>
                <td>{holiday.name}</td>
                <td>{holiday.departments.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No holidays found.</p>
      )}
 
      {/* Add Holiday Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Add Holiday</h2>
        <div className="form-group">
          <label>Holiday Name</label>
          <input
            type="text"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Holiday Date</label>
          <input
            type="date"
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Departments</label>
          {departments.map((dept) => (
            <div key={dept} className="checkbox-group">
              <input
                type="checkbox"
                id={dept}
                checked={selectedDepartments.includes(dept)}
                onChange={() => toggleDepartment(dept)}
              />
              <label htmlFor={dept}>{dept}</label>
            </div>
          ))}
        </div>
        <div className="btn-container">
          <button onClick={addHoliday} className="approve-btn">Add</button>
          <button onClick={() => setModalIsOpen(false)} className="decline-btn">Cancel</button>
        </div>
      </Modal>
    </div>
    </main>

    </>
  );
};

export default HolidayList;
