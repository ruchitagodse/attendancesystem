import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './LeaveRequests.css';
import * as XLSX from 'xlsx';
import Header from '../Header';
import Navbar from '../Navbar';
import logo from '../../videoframe_logo.png';
import { FaSearch } from "react-icons/fa";

const LeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    leaveType: '',
    status: '',
  });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const leaveRequestsCollection = collection(db, 'leaveRequests');

    // Real-time listener for leave requests
    const unsubscribe = onSnapshot(leaveRequestsCollection, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort requests to prioritize Pending and by timestamp or startDate in descending order
      requests.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (b.status === 'Pending' && a.status !== 'Pending') return 1;
        const dateA = a.timestamp ? a.timestamp.toDate() : new Date(a.startDate);
        const dateB = b.timestamp ? b.timestamp.toDate() : new Date(b.startDate);
        return dateB - dateA; // Newest first
      });

      const pendingRequests = requests.filter((request) => request.status === 'Pending');
      setPendingCount(pendingRequests.length);
      setLeaveRequests(requests);
      setFilteredRequests(requests);
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  useEffect(() => {
    const filtered = leaveRequests.filter((request) => {
      const matchesName = request.displayName.toLowerCase().includes(filters.name.toLowerCase());
      const matchesLeaveType = request.leaveType.toLowerCase().includes(filters.leaveType.toLowerCase());
      const matchesStatus = request.status.toLowerCase().includes(filters.status.toLowerCase());

      return matchesName && matchesLeaveType && matchesStatus;
    });
    setFilteredRequests(filtered);
  }, [filters, leaveRequests]);

  const formatDate = (dateString) => {
    const dateParts = dateString.split('-'); // Split 'yyyy-mm-dd' into parts
    if (dateParts.length !== 3) return dateString; // Return original if format is unexpected
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // Return 'dd/mm/yyyy'
  };
  const exportToExcel = () => {
    const formattedData = leaveRequests.map((request) => ({
      Name: request.displayName || 'N/A',
      'Leave Type': request.leaveType || 'N/A',
      'Start Date': formatDate(request.startDate) || 'N/A',
      'End Date': formatDate(request.endDate) || 'N/A',
      Status: request.status || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LeaveRequests');

    XLSX.writeFile(workbook, 'LeaveRequests.xlsx');
  };
  return (
    <>
      <Header />
      <div className="logoContainer">
        <img src={logo} alt="Logo" className="logos" />
      </div>
      <main className="maincontainer">
        <Navbar pendingCount={pendingCount} />
        <div className="leave-requests-container">
          <h2>Leave Requests</h2>
          <div className="export-button-container">
          <button className="export-button" onClick={exportToExcel}>
            Export to Excel
          </button>
          </div>
          {/* <button className="m-button-5" onClick={() => window.history.back()}>
            Back
          </button> */}
          
         
          {filteredRequests.length > 0 ? (
            <table className="leave-requests-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <thead>
                <tr>
                  <th>
                  <div className="search">
            <input
              type="text"
              name="name"
              placeholder="Filter by Name"
              value={filters.name}
              onChange={handleFilterChange}
            />
             <button type="submit" className="searchButton">
                        <FaSearch />
                      </button>
              </div>
                  </th>
                  <th>
                  <div className="search">
                  <input
              type="text"
              name="leaveType"
              placeholder="Filter by Leave Type"
              value={filters.leaveType}
              onChange={handleFilterChange}
            />
             <button type="submit" className="searchButton">
                        <FaSearch />
                      </button>
            </div>
                  </th>
                  <th>

                  </th>
                  <th></th>
                  <th>
                  <div className="search">
                  <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
            </select>
            <button type="submit" className="searchButton">
                        <FaSearch />
                      </button>
        
        </div>
                  </th>
                  <th>
                 
           
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className={request.status.trim().toLowerCase() === 'pending' ? 'highlight-yellow' : ''}
                  >
                    <td>{request.displayName}</td>
                    <td>{request.leaveType}</td>
                    <td>{formatDate(request.startDate)}</td>
                    <td>{formatDate(request.endDate)}</td>
                    <td>{request.status}</td>
                    <td>
                      <Link to={`/leave-request/${request.id}`} className="m-button-8">
                        View
                      </Link>
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
      </main>
    </>
  );
};

export default LeaveRequests;
