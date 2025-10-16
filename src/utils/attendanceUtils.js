// utils/attendanceReport.js
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export const generateAttendanceReport = async (date) => {
  try {
    const presentUsers = [];
    const leaveUsers = [];
    const notMarkedUsers = [];
    const onHolidayUsers = [];

    // Fetch all employees from employeeDetails
    const usersCollection = collection(db, "employeeDetails");
    const usersSnapshot = await getDocs(usersCollection);

    const allUsers = usersSnapshot.docs
      .map((userDoc) => {
        const data = userDoc.data();
        const personalInfo = data.personalInfo || {};

        return {
          id: userDoc.id, // phone number as docId
          name: personalInfo.name || "Unknown User",
          department: personalInfo.department || "Unknown",
          status: personalInfo.status || "active",
        };
      })
      // Exclude "Resigned" and "Terminated" users
      .filter(
        (user) =>
          user.status.toLowerCase() !== "resigned" &&
          user.status.toLowerCase() !== "terminated"
      );

    // Fetch holidays for the given date
    const holidaysCollection = collection(db, "holidays");
    const holidaysQuery = query(holidaysCollection, where("date", "==", date));
    const holidaysSnapshot = await getDocs(holidaysQuery);
    const holidays = holidaysSnapshot.docs.map((doc) => doc.data());

    const departmentsOnHoliday = new Set();
    holidays.forEach((holiday) => {
      (holiday.departments || []).forEach((dept) =>
        departmentsOnHoliday.add(dept)
      );
    });

    // Process each user
    for (const user of allUsers) {
      const { id: userId, name: userName, department } = user;

      // Check if department is on holiday
      if (departmentsOnHoliday.has(department)) {
        onHolidayUsers.push({ name: userName, department });
        continue;
      }

      // Check leave requests
      const leaveRequestsQuery = query(
        collection(db, "leaveRequests"),
        where("userId", "==", userId),
        where("startDate", "<=", date),
        where("endDate", ">=", date)
      );
      const leaveRequestsSnapshot = await getDocs(leaveRequestsQuery);
      const leaveRequestData = leaveRequestsSnapshot.docs.map((doc) =>
        doc.data()
      );

      if (leaveRequestData.length > 0) {
        const leaveStatus = leaveRequestData.some((r) => r.status === "Approved")
          ? "Approved"
          : leaveRequestData.some((r) => r.status === "Pending")
          ? "Pending"
          : leaveRequestData.some((r) => r.status === "Declined")
          ? "Declined"
          : "Rejected";

        leaveUsers.push({ name: userName, department, leaveStatus });
        continue;
      }

      // Check session attendance for the given date
      const sessionDocRef = doc(db, "employeeDetails", userId, "sessions", date);
      const sessionDoc = await getDoc(sessionDocRef);

      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        const loginTime = sessionData?.sessions?.[0]?.loginTime || "N/A";
        presentUsers.push({ name: userName, loginTime, department });
      } else {
        notMarkedUsers.push({ name: userName, department });
      }
    }

    // Sort present users: "UJustBe" dept first, then by login time
    const sortedUsers = presentUsers.sort((a, b) => {
      if (a.department === "UJustBe" && b.department !== "UJustBe") return -1;
      if (a.department !== "UJustBe" && b.department === "UJustBe") return 1;
      return new Date(a.loginTime) - new Date(b.loginTime);
    });

    return {
      presentUsers: sortedUsers,
      leaveUsers,
      notMarkedUsers,
      onHolidayUsers,
    };
  } catch (error) {
    console.error("Error generating attendance report:", error);
    return {
      presentUsers: [],
      leaveUsers: [],
      notMarkedUsers: [],
      onHolidayUsers: [],
    };
  }
};
