"use client"; // Needed for client-side state and useEffect in Next.js 13+

import React, { useEffect, useState } from "react";
import { generateAttendanceReport } from "../../src/utils/attendanceUtils";
// import Header from "../Header";
// import Navbar from "../Navbar";
import Image from "next/image";
import logo from "../../public/videoframe_logo.png";

const UserReport = () => {
  const [attendanceReport, setAttendanceReport] = useState({
    presentUsers: [],
    leaveUsers: [],
    notMarkedUsers: [],
    onHolidayUsers: [],
  });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchAttendanceReport = async (selectedDate) => {
    setLoading(true);
    const report = await generateAttendanceReport(selectedDate);
    setAttendanceReport(report);
    setLoading(false);
  };

  // Format time to 'HH:MM AM/PM'
  const formatTime = (timeString) => {
    if (!timeString || timeString === "N/A") return "-";
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  useEffect(() => {
    fetchAttendanceReport(date);
  }, [date]);

  const maxLength = Math.max(
    attendanceReport.presentUsers.length,
    attendanceReport.leaveUsers.length,
    attendanceReport.notMarkedUsers.length,
    attendanceReport.onHolidayUsers.length
  );

  return (
    <>
      {/* <Header /> */}
      <div className="logoContainer">
        <Image src={logo} alt="Logo" width={120} height={60} className="logos" />
      </div>
      {/* <Navbar /> */}
      <main className="maincontainer">
        <div className="users-table-container">
          <h2>Attendance Report</h2>
          <button className="m-button-5" onClick={() => window.history.back()}>
            Back
          </button>

          <div className="form-group">
            <label>Select Date: </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {loading ? (
            <div>Loading report...</div>
          ) : (
            <div>
              <h3>Attendance Report for {date}</h3>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Present Users</th>
                    <th>Login Time</th>
                    <th>Users on Leave</th>
                    <th>Status</th>
                    <th>Not Marked Attendance</th>
                    <th>Users on Holiday</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxLength }).map((_, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>

                      {/* Present Users */}
                      <td>
                        {attendanceReport.presentUsers[index]
                          ? `${attendanceReport.presentUsers[index].name} (${attendanceReport.presentUsers[index].department})`
                          : "-"}
                      </td>
                      <td>
                        {attendanceReport.presentUsers[index]
                          ? formatTime(attendanceReport.presentUsers[index].loginTime)
                          : "-"}
                      </td>

                      {/* Users on Leave */}
                      <td>
                        {attendanceReport.leaveUsers[index]
                          ? `${attendanceReport.leaveUsers[index].name} (${attendanceReport.leaveUsers[index].department})`
                          : "-"}
                      </td>
                      <td>
                        {attendanceReport.leaveUsers[index]?.leaveStatus || "-"}
                      </td>

                      {/* Not Marked Attendance */}
                      <td>
                        {attendanceReport.notMarkedUsers[index]
                          ? `${attendanceReport.notMarkedUsers[index].name} (${attendanceReport.notMarkedUsers[index].department})`
                          : "-"}
                      </td>

                      {/* Users on Holiday */}
                      <td>
                        {attendanceReport.onHolidayUsers[index]
                          ? `${attendanceReport.onHolidayUsers[index].name} (${attendanceReport.onHolidayUsers[index].department})`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default UserReport;
