import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import './UserSession.css';
import UserHeader from './UserHeader';

const UserSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [userName, setUserName] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { userId } = useParams();
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        // Fetch user name
        const userDoc = await getDoc(doc(db, 'employee', userId));
        if (userDoc.exists()) {
          setUserName(userDoc.data().displayName);
        }

        // Fetch sessions
        const sessionsCollection = collection(db, 'employee', userId, 'sessions');
        const sessionSnapshot = await getDocs(sessionsCollection);
        const userSessions = sessionSnapshot.docs
          .map(doc => ({
            date: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setSessions(userSessions);

        // Fetch leave requests
        const leaveRequestsCollection = collection(db, 'leaveRequests');
        const leaveSnapshot = await getDocs(leaveRequestsCollection);
        const userLeaveRequests = leaveSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeaveRequests(userLeaveRequests);
      } catch (error) {
        console.error('Error fetching user data or sessions:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
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
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const calculateTotalBreakTime = (breaks) => {
    if (!breaks || breaks.length === 0) return '0 hr 0 min';

    const totalBreakTimeInSeconds = breaks.reduce((total, breakPeriod) => {
      const breakStart = new Date(breakPeriod.breakStart);
      const breakEnd = new Date(breakPeriod.breakEnd);
      return total + (breakEnd - breakStart) / 1000;
    }, 0);

    const totalHours = Math.floor(totalBreakTimeInSeconds / 3600);
    const totalMinutes = Math.floor((totalBreakTimeInSeconds % 3600) / 60);
    return `${totalHours} hr ${totalMinutes} min`;
  };

  const determineStatus = (sessionDate, sessionDetail) => {
    const today = new Date().toISOString().split('T')[0];
    const leaveRequest = leaveRequests.find(
      (leave) =>
        leave.userId === userId &&
        new Date(leave.startDate) <= new Date(sessionDate) &&
        new Date(leave.endDate) >= new Date(sessionDate)
    );

    if (leaveRequest) {
      return `On Leave (${leaveRequest.leaveType || 'N/A'})`; // Include leave type
    }

    if (sessionDate === today && sessionDetail.loginTime && !sessionDetail.logoutTime) {
      return 'Ongoing'; // Show "Ongoing" if today’s date is matched and login exists but logout does not
    }
  
    if (sessionDetail.loginTime && !sessionDetail.logoutTime) {
      return 'Forgot to Mark Attendance';
    }

    if (!sessionDetail.loginTime) {
      return '-'; // No login record
    }

    return 'Present';
  };

  const filteredSessions = sessions.filter((session) => {
    const month = session.currentMonth || '';
    const date = formatDate(session.date);
    const matchesMonth = month.toLowerCase().includes(monthFilter.toLowerCase());
    const matchesDate = date.toLowerCase().includes(dateFilter.toLowerCase());
    return (monthFilter === '' || matchesMonth) && (dateFilter === '' || matchesDate);
  });

  return (
    <>
      <UserHeader />
      <div className="sessions-panel-wrapper">
        <div className="user-session">
          <h2>Attendance {userName && `of ${userName}`}</h2>
          <button className="m-button-5" onClick={() => window.history.back()}>
            Back
          </button>

          <div className="session-table-container">
            {filteredSessions.length > 0 ? (
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Date</th>
                    <th>Login Time</th>
                    <th>Logout Time</th>
                    <th>Break Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    session.sessions.map((sessionDetail, i) => (
                      <tr
                        key={`${session.date}-${i}`}
                        className={determineStatus(session.date, sessionDetail).includes('On Leave')
                          ? 'on-leave'
                          : determineStatus(session.date, sessionDetail).includes('Forgot to Mark Attendance')
                          ? 'forgot-to-mark'
                          : determineStatus(session.date, sessionDetail).includes('Ongoing')
                          ? 'ongoing'
                          : ''}
                      >
                        <td>{session.currentMonth || 'N/A'}</td>
                        <td>{formatDate(session.date)}</td>
                        <td>{sessionDetail.loginTime ? formatDateTime(sessionDetail.loginTime) : 'N/A'}</td>
                        <td>
                          {sessionDetail.logoutTime
                            ? formatDateTime(sessionDetail.logoutTime)
                            : sessionDetail.onLeave
                            ? 'On Leave'
                            : sessionDetail.loginTime
                            ? 'Still Logged in'
                            : '-'}
                        </td>
                        <td>{sessionDetail.breaks ? calculateTotalBreakTime(sessionDetail.breaks) : '-'}</td>
                        <td className={determineStatus(session.date, sessionDetail) === 'Ongoing' ? 'ongoing' : ''}>
                          {determineStatus(session.date, sessionDetail)}
                        </td>
                      </tr>
                    ))
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
        </div>
      </div>

      <style jsx>{`
        .on-leave {
          background-color: rgba(255, 0, 0, 0.3);
        }

        .forgot-to-mark {
          background-color: rgba(43, 28, 19, 0.3);
        }

        .ongoing {
          background-color: #a2cbda;
        }
      `}</style>
    </>
  );
};

export default UserSessions;
