import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import logo from '../videoframe_logo.png';
import { useNavigate } from 'react-router-dom';  
import './UserSessions.css';
import Header from './Header';
import Navbar from './Navbar';
import { FaSearch } from "react-icons/fa";

const UserSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [expandedDates, setExpandedDates] = useState([]);
  const [userName, setUserName] = useState('');
  const { userId } = useParams();
  const [monthFilter, setMonthFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const navigate = useNavigate();  

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        // Fetch user's name
        const userDoc = await getDoc(doc(db, 'employee', userId));
        if (userDoc.exists()) {
          setUserName(userDoc.data().displayName);
        }

        // Fetch user sessions
        const sessionsCollection = collection(db, 'employee', userId, 'sessions');
        const sessionSnapshot = await getDocs(sessionsCollection);
        const userSessions = sessionSnapshot.docs
          .map(doc => ({
            date: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
        setSessions(userSessions);
      } catch (error) {
        console.error('Error fetching user data or sessions:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  const toggleDate = (date) => {
    setExpandedDates((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date]
    );
  };

  const handleBack = () => {
    navigate(-1);  // Navigate back to the previous page
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Add leading zero if needed
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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

  const calculateTotalBreakTime = (breaks) => {
    if (!breaks || breaks.length === 0) return '0 hr 0 min 0 sec';
  
    const totalBreakTimeInSeconds = breaks.reduce((totalBreakTime, breakPeriod) => {
      const breakStart = new Date(breakPeriod.breakStart);
      const breakEnd = new Date(breakPeriod.breakEnd);
      const diffInMilliseconds = breakEnd - breakStart; // Difference in milliseconds
      const diffInSeconds = diffInMilliseconds / 1000; // Convert to seconds
      return totalBreakTime + diffInSeconds;
    }, 0);
  
    // Calculate hours, minutes, and seconds
    const totalHours = Math.floor(totalBreakTimeInSeconds / 3600); // 1 hour = 3600 seconds
    const totalMinutes = Math.floor((totalBreakTimeInSeconds % 3600) / 60); // Remaining minutes
    const totalSeconds = Math.floor(totalBreakTimeInSeconds % 60); // Remaining seconds
    
    return `${totalHours} hr ${totalMinutes} min`; // Return formatted string
  };
  

  // Case-insensitive filtering for month and date separately
  const filteredSessions = sessions.filter((session) => {
    const month = session.currentMonth || '';
    const date = formatDate(session.date);
    const lowerCaseMonthFilter = monthFilter.toLowerCase(); 
    const lowerCaseDateFilter = dateFilter.toLowerCase(); 

    const matchesMonth = month.toLowerCase().includes(lowerCaseMonthFilter); 
    const matchesDate = date.toLowerCase().includes(lowerCaseDateFilter);

    return (monthFilter === '' || matchesMonth) && (dateFilter === '' || matchesDate);
  });

  return (
    <>
      <Header />
      <div className='logoContainer'>
        <img src={logo} alt="Logo" className="logos" />
      </div>
      <Navbar />
      <main className='maincontainer'>
        <div className="sessions-table-container">
          <h2>Attendance {userName && `of ${userName}`}</h2> 
          <button className="m-button-5" onClick={handleBack}>
            Back
          </button>
          {filteredSessions.length > 0 ? (
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Date</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                  <th>Break Time (mins)</th> {/* New column for Break Time */}
                </tr>
              </thead>
              <thead>
                <tr>
                  <th>
                    <div className="search">
                      <input
                        type="text"
                        placeholder="Filter by month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)} 
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
                        placeholder="Filter by date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)} 
                      />
                      <button type="submit" className="searchButton">
                        <FaSearch />
                      </button>
                    </div>
                  </th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <React.Fragment key={session.date}>
                    <tr
                      className="user-link"
                      onClick={() => toggleDate(session.date)}
                      style={{ cursor: 'pointer', color: 'black' }}
                    >
                      <td>{session.currentMonth || 'N/A'}</td>
                      <td>{formatDate(session.date)} {expandedDates.includes(session.date) ? '▲' : '▼'}</td>
                      <td colSpan="2"></td>
                      <td></td> {/* Empty cell for alignment */}
                    </tr>
                    {expandedDates.includes(session.date) &&
                      session.sessions.map((sessionDetail, i) => (
                        <tr key={`${session.date}-${i}`}>
                          <td></td>
                          <td></td>
                          <td>{formatDateTime(sessionDetail.loginTime)}</td>
                          <td>{sessionDetail.logoutTime ? formatDateTime(sessionDetail.logoutTime) : 'Still Logged In'}</td>
                          <td>{calculateTotalBreakTime(sessionDetail.breaks)}</td> {/* Display Total Break Time */}
                        </tr>
                      ))}
                  </React.Fragment>
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

export default UserSessions;
