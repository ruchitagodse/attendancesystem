'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import Header from '../../component/Header';
import Navbar from '../../component/Navbar';
import logo from '../../public/videoframe_logo.png';
import { FaSearch } from "react-icons/fa";
import * as XLSX from 'xlsx';
import '../../src/app/styles/page/_LeaveRequest.scss'
import "../../src/app/styles/main.scss";



const LeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filters, setFilters] = useState({ name: '', leaveType: '', status: '' });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const leaveRequestsCollection = collection(db, 'leaveRequest');

    // Real-time listener for leave requests
    const unsubscribe = onSnapshot(leaveRequestsCollection, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort: Pending first, then newest startDate
      requests.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (b.status === 'Pending' && a.status !== 'Pending') return 1;
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.startDate);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.startDate);
        return dateB - dateA;
      });

      setPendingCount(requests.filter(r => r.status === 'Pending').length);
      setLeaveRequests(requests);
      setFilteredRequests(requests);
    });

    return () => unsubscribe();
  }, []);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters whenever filters or requests change
  useEffect(() => {
    const filtered = leaveRequests.filter(r => 
      r.displayName.toLowerCase().includes(filters.name.toLowerCase()) &&
      r.leaveType.toLowerCase().includes(filters.leaveType.toLowerCase()) &&
      r.status.toLowerCase().includes(filters.status.toLowerCase())
    );
    setFilteredRequests(filtered);
  }, [filters, leaveRequests]);

  // Format dates as dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
  };

  // Export to Excel
  const exportToExcel = () => {
    const formattedData = leaveRequests.map(r => ({
      Name: r.displayName || 'N/A',
      'Leave Type': r.leaveType || 'N/A',
      'Start Date': formatDate(r.startDate),
      'End Date': formatDate(r.endDate),
      Status: r.status || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LeaveRequest');
    XLSX.writeFile(workbook, 'LeaveRequests.xlsx');
  };

  return (
    <>
      <Header />
      {/* <div className="logoContainer">
        <img src={logo.src} alt="Logo" className="logos" />
      </div> */}
      <main className="maincontainer">
        <Navbar pendingCount={pendingCount} />

        <div className="leave-requests-container">
          <h2>Leave Requests</h2>

          <div className="export-button-container">
            <button className="export-button" onClick={exportToExcel}>
              Export to Excel
            </button>
          </div>

          {filteredRequests.length > 0 ? (
            <table className="leave-requests-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <thead>
                <tr>
                  <th>
                    <div className="search">
                      <input type="text" name="name" placeholder="Filter by Name" value={filters.name} onChange={handleFilterChange} />
                      <button type="submit" className="searchButton"><FaSearch /></button>
                    </div>
                  </th>
                  <th>
                    <div className="search">
                      <input type="text" name="leaveType" placeholder="Filter by Leave Type" value={filters.leaveType} onChange={handleFilterChange} />
                      <button type="submit" className="searchButton"><FaSearch /></button>
                    </div>
                  </th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th>
                    <div className="search">
                      <select name="status" value={filters.status} onChange={handleFilterChange}>
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Declined">Declined</option>
                      </select>
                      <button type="submit" className="searchButton"><FaSearch /></button>
                    </div>
                  </th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map(request => (
                  <tr key={request.id} className={request.status.trim().toLowerCase() === 'pending' ? 'highlight-yellow' : ''}>
                    <td>{request.displayName}</td>
                    <td>{request.leaveType}</td>
                    <td>{formatDate(request.startDate)}</td>
                    <td>{formatDate(request.endDate)}</td>
                    <td>{request.appliedDate ? formatDate(request.appliedDate) : 'N/A'}</td>
                    <td>{request.status}</td>
                    <td>
                      <Link href={`/leave-request/${request.id}`} className="m-button-8">
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
