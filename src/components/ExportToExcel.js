import React, { useState } from 'react'; 
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import './ExportToExcel.css';

const ExportToExcel = () => {
  const [loading, setLoading] = useState(false);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const fetchDataAndExport = async () => {
    setLoading(true);

    try {
      const employeeSnapshot = await getDocs(collection(db, 'employee'));  
      const data = [];

      for (const employeeDoc of employeeSnapshot.docs) {
        const employeeData = employeeDoc.data();
        const Name = employeeData.displayName;

        const sessionsSnapshot = await getDocs(collection(db, 'employee', employeeDoc.id, 'sessions'));

        sessionsSnapshot.forEach((sessionDoc) => {
          const sessionData = sessionDoc.data();

          if (Array.isArray(sessionData.sessions)) {
            const sessionDate = sessionDoc.id;

            sessionData.sessions.forEach((session) => {
              const loginTime = session.loginTime ? formatDateTime(session.loginTime) : 'N/A';
              const logoutTime = session.logoutTime ? formatDateTime(session.logoutTime) : 'N/A';
              const month = sessionData.currentMonth || 'N/A';

              data.push({
                Name,
                month,                      
                date: sessionDate,
                loginTime,
                logoutTime 
              });
            });
          }
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Sessions");

      XLSX.writeFile(workbook, "employee_sessions_data.xlsx");

      Swal.fire({
        icon: 'success',
        title: 'Export Complete',
        text: 'Employee attendance data exported successfully!',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      console.error("Error fetching data from Firestore:", error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting the data. Please try again.',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-button-container">
     <button className={`export-button ${loading ? 'loading' : ''}`} onClick={fetchDataAndExport}>
  {loading ? (
    <>
      Exporting...
    
    </>
  ) : (
    "Download XLS"
  )}
</button>


  
    </div>
  );
};

export default ExportToExcel;
