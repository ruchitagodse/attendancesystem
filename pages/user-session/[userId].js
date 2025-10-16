import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import '../../src/app/styles/page/_UserSession.scss';
import UserHeader from '../../component/UserHeader';

const UserSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [userName, setUserName] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [userDepartment, setUserDepartment] = useState('');

  const router = useRouter();
  const { userId } = router.query;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        // Fetch user details
        const userDoc = await getDoc(doc(db, 'employeeDetails', userId));
        if (userDoc.exists()) {
          setUserName(userDoc.data().displayName);
          setUserDepartment(userDoc.data().department);
        }

        // Fetch sessions
        const sessionsCollection = collection(db, 'employeeDetails', userId, 'sessions');
        const sessionSnapshot = await getDocs(sessionsCollection);

        const fetchedSessions = sessionSnapshot.docs.map((doc) => ({
          id: doc.id,
          date: doc.data().dateKey,
          loginTime: doc.data().loginTime?.toDate ? doc.data().loginTime.toDate() : doc.data().loginTime,
          logoutTime: doc.data().logoutTime?.toDate ? doc.data().logoutTime.toDate() : doc.data().logoutTime,
          breaks: doc.data().breaks || [],
          currentMonth: new Date(doc.data().dateKey).toLocaleString('default', { month: 'long' }),
        }));

        setSessions(fetchedSessions.sort((a, b) => new Date(b.date) - new Date(a.date)));

        // Fetch leave requests
        const leaveSnapshot = await getDocs(collection(db, 'leaveRequests'));
        setLeaveRequests(
          leaveSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        // Fetch holidays
        const holidaySnapshot = await getDocs(collection(db, 'holidays'));
        setHolidays(holidaySnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  // Formatters
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${formatDate(dateString)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const calculateTotalBreakTime = (breaks) => {
    if (!breaks || breaks.length === 0) return '0 hr 0 min';
    const totalSeconds = breaks.reduce((total, b) => total + (new Date(b.breakEnd) - new Date(b.breakStart)) / 1000, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours} hr ${minutes} min`;
  };

  const determineStatus = (sessionDate, sessionDetail) => {
    const today = new Date().toISOString().split('T')[0];
    const leave = leaveRequests.find(
      (l) =>
        l.userId === userId &&
        new Date(l.startDate) <= new Date(sessionDate) &&
        new Date(l.endDate) >= new Date(sessionDate)
    );

    if (leave) return `On Leave (${leave.leaveType || 'N/A'})`;
    if (sessionDate === today && sessionDetail?.loginTime && !sessionDetail?.logoutTime) return 'Ongoing';
    if (sessionDetail?.loginTime && !sessionDetail?.logoutTime) return 'Forgot to Mark Attendance';
    if (!sessionDetail?.loginTime) return '-';
    return 'Present';
  };

  // Combine sessions + holidays
  const combinedSessions = [
    ...sessions,
    ...holidays
      .filter((h) => h.departments.includes(userDepartment))
      .map((h) => ({
        id: `holiday-${h.date}`,
        date: h.date,
        loginTime: null,
        logoutTime: null,
        breaks: [],
        currentMonth: new Date(h.date).toLocaleString('default', { month: 'long' }),
        holiday: true,
        holidayName: h.name,
      })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((s) => {
      const month = s.currentMonth.toLowerCase();
      const date = formatDate(s.date);
      return (monthFilter === '' || month.includes(monthFilter.toLowerCase())) &&
             (dateFilter === '' || date.includes(dateFilter.toLowerCase()));
    });

  return (
    <>
      <UserHeader />
      <div className="sessions-panel-wrapper">
        <div className="user-session">
          <h2>Attendance {userName && `of ${userName}`}</h2>
          <button className="m-button-5" onClick={() => router.back()}>Back</button>
          <div className="session-table-container">
            {combinedSessions.length > 0 ? (
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
                  {combinedSessions.map((session) => (
                    <tr key={session.id} className={session.holiday ? 'holiday-row' : ''}>
                      <td>{session.currentMonth}</td>
                      <td>{formatDate(session.date)}</td>
                      <td>{session.holiday ? '-' : session.loginTime ? formatDateTime(session.loginTime) : '-'}</td>
                      <td>
                        {session.holiday
                          ? session.holidayName
                          : session.logoutTime
                            ? formatDateTime(session.logoutTime)
                            : session.loginTime
                              ? 'Still Logged in'
                              : '-'}
                      </td>
                      <td>{session.holiday ? '-' : calculateTotalBreakTime(session.breaks)}</td>
                      <td>{session.holiday ? session.holidayName : determineStatus(session.date, session)}</td>
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
        </div>
      </div>

      <style jsx>{`
        .holiday-row { background-color: rgba(239,130,6,0.5); font-weight: bold; }
      `}</style>
    </>
  );
};

export default UserSessions;
