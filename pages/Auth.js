"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  auth,
  db
} from "../firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  OAuthProvider,
  setPersistence,
  browserSessionPersistence,
   onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  orderBy,onSnapshot,
  limit
} from "firebase/firestore";

import { AiOutlineLogin } from "react-icons/ai";
import { MdOutlineArrowForwardIos } from "react-icons/md";

import LeaveModal from "./LeaveModal";
import UserNotifications from "./UserNotifications";

import MicrosoftLogo from "../public/microsoft-logo.png";
import UjustbeLogo from "../public/videoframe_logo.png";
import "../src/app/styles/page/_Auth.scss";

const Auth = () => {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginTime, setLoginTime] = useState(null);
  const [slogans, setSlogans] = useState([]);
  const [currentSlogan, setCurrentSlogan] = useState({
    title: "",
    description: "",
  });
  const [onBreak, setOnBreak] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
 
  // ✅ Login with Microsoft, check email, and use phoneNumber as doc.id
 // --- LOGIN: create a session document in subcollection (employeeDetails/{phone}/sessions) ---
const handleLogin = async () => {
  if (loading) return;
  setLoading(true);

  try {
    const provider = new OAuthProvider("microsoft.com");
    provider.setCustomParameters({ prompt: "select_account" });

    await setPersistence(auth, browserSessionPersistence);

    const result = await signInWithPopup(auth, provider);
    const loggedInUser = result.user;
    const email = loggedInUser.email;

    // 🔍 find the employee record by email
    const employeeRef = collection(db, "employeeDetails");
    const q = query(employeeRef, where("personalInfo.email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await signOut(auth);
      alert("Your email is not registered. Please contact admin.");
      return;
    }

    // ✅ phoneNumber is doc.id
    const employeeDoc = snapshot.docs[0];
    const phoneNumber = employeeDoc.id;
    const employeeData = employeeDoc.data();

    // 🔑 sessions subcollection
    const sessionsCol = collection(db, "employeeDetails", phoneNumber, "sessions");
    const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
// check if today's session exists
const qSessions = query(sessionsCol, where("dateKey", "==", dateKey));
const sessionSnap = await getDocs(qSessions);

let sessionDocRef;
let loginTimeValue;

if (!sessionSnap.empty) {
  // 📌 Reuse existing session
  const todaySession = sessionSnap.docs[0];
  sessionDocRef = todaySession.ref;
  loginTimeValue = todaySession.data().loginTime?.toDate
    ? todaySession.data().loginTime.toDate().toISOString()
    : todaySession.data().loginTime;
} else {
  // ✨ Create new session
  const sessionPayload = {
    dateKey,
    loginTime: serverTimestamp(),
    logoutTime: null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    breaks: [],
    onBreak: null,
  };
  sessionDocRef = doc(db, "employeeDetails", phoneNumber, "sessions", dateKey);
  await setDoc(sessionDocRef, sessionPayload); // ✅ save with dateKey
  loginTimeValue = new Date().toISOString();
}


    // 💾 Save session locally
    if (typeof window !== "undefined") {
      localStorage.setItem("sessionDocId", sessionDocRef.id);
      localStorage.setItem("sessionPhone", phoneNumber);
      localStorage.setItem("loginTime", loginTimeValue);
    }

    // ✅ Update React state
    setUser({ ...loggedInUser, userId: phoneNumber, employeeData });
    setSessionId(sessionDocRef.id);
    setLoginTime(loginTimeValue);

  } catch (err) {
    console.error("Error during login:", err);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const email = firebaseUser.email;

      // fetch employee info from Firestore
      const employeeRef = collection(db, "employeeDetails");
      const q = query(employeeRef, where("personalInfo.email", "==", email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const employeeDoc = snapshot.docs[0];
        const phoneNumber = employeeDoc.id;
        const employeeData = employeeDoc.data();

        // restore session info from localStorage first
        const savedSessionId = localStorage.getItem("sessionDocId");
        const savedLoginTime = localStorage.getItem("loginTime");

        if (savedSessionId && savedLoginTime) {
          setUser({ ...firebaseUser, userId: phoneNumber, employeeData });
          setSessionId(savedSessionId);
          setLoginTime(savedLoginTime);
          console.log("🔄 Session restored from localStorage");
        } else {
          // check if today's session exists in Firestore
          const sessionsCol = collection(db, "employeeDetails", phoneNumber, "sessions");
          const todayKey = new Date().toISOString().split("T")[0];
          const sessionSnap = await getDocs(sessionsCol);
          const todaySession = sessionSnap.docs.find(doc => doc.data().dateKey === todayKey);

          if (todaySession) {
            setUser({ ...firebaseUser, userId: phoneNumber, employeeData });
            setSessionId(todaySession.id);

            const loginTimeValue = todaySession.data().loginTime?.toDate
              ? todaySession.data().loginTime.toDate().toISOString()
              : todaySession.data().loginTime;

            setLoginTime(loginTimeValue);

            // save in localStorage for next refresh
            localStorage.setItem("sessionDocId", todaySession.id);
            localStorage.setItem("sessionPhone", phoneNumber);
            localStorage.setItem("loginTime", loginTimeValue);

            console.log("🔄 Restored today's session from Firestore");
          }
        }
      } else {
        console.error("❌ Employee not found in Firestore!");
        await signOut(auth);
      }
    } else {
      // no user → clear state
      setUser(null);
      setSessionId(null);
      setLoginTime(null);
      localStorage.removeItem("sessionDocId");
      localStorage.removeItem("sessionPhone");
      localStorage.removeItem("loginTime");
    }
  });

  return () => unsubscribe();
}, []);

// --- LOGOUT: update the session document's logoutTime with serverTimestamp() ---
const handleLogout = async () => {
  try {
    // prefer state, fallback to localStorage
    const phoneNumber = user?.userId || (typeof window !== "undefined" && localStorage.getItem("sessionPhone"));
    const sessionDocId = sessionId || (typeof window !== "undefined" && localStorage.getItem("sessionDocId"));

    if (!phoneNumber || !sessionDocId) {
      // nothing to update server-side — still sign out locally
      await signOut(auth);
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("sessionDocId");
        localStorage.removeItem("sessionPhone");
        localStorage.removeItem("loginTime");
      }
      return;
    }

    const sessionDocRef = doc(db, "employeeDetails", phoneNumber, "sessions", sessionDocId);

    // update logoutTime to server time
    await updateDoc(sessionDocRef, {
      logoutTime: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });

    console.log("Logout time updated for session:", sessionDocId);

    // cleanup local state
    await signOut(auth);
    setUser(null);
    setSessionId(null);
    setLoginTime(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("sessionDocId");
      localStorage.removeItem("sessionPhone");
      localStorage.removeItem("loginTime");
    }
  } catch (err) {
    console.error("Error during logout:", err);
  }
};

// ✅ Safe localStorage hydration
useEffect(() => {
  if (typeof window !== "undefined") {
    setSessionId(localStorage.getItem("sessionDocId") || null);
    setLoginTime(localStorage.getItem("loginTime") || null);
  }
}, []);


  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "employeeDetails", user.uid, "notifications");
    const notificationsQuery = query(notificationsRef, where("read", "==", false));

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetchedNotifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(fetchedNotifications);
          setUnreadCount(fetchedNotifications.length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      },
      (error) => {
        console.error("Error in onSnapshot:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ✅ Current Date
  useEffect(() => {
    const date = new Date();
    setCurrentDate(date.toLocaleDateString("en-GB"));
  }, []);

  // ✅ Update Time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ✅ Break Timer
  useEffect(() => {
    let timer;
    if (onBreak) {
      timer = setInterval(() => {
        const now = new Date().getTime();
        const breakStart = new Date(onBreak).getTime();
        setElapsedTime(Math.floor((now - breakStart) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(timer);
  }, [onBreak]);



 const fetchBreakState = async (user, sessionId) => {
    if (!user?.uid) {
      console.error("User UID is not available");
      return; // Exit if user UID is not available
    }
    
    if (!sessionId) {
      console.error("Session ID is missing");
      return; // Exit if sessionId is missing
    }
  
    const currentDate = new Date().toISOString().split("T")[0]; // Get the current date
    const sessionRef = doc(db, "employeeDetails", user.uid, "sessions", currentDate);
  
    try {
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        console.log("Session Data:", sessionData); // Debugging session data
        const currentSession = sessionData?.sessions?.find(
          (session) => session.sessionId === sessionId
        );
  
        if (currentSession?.onBreak !== undefined) {
          console.log("Current Session Break State:", currentSession.onBreak); // Debug the break state
          setOnBreak(currentSession.onBreak); // Restore break start time
        } else {
          console.log("Session does not have an onBreak property or session not found.");
        }
      } else {
        console.log("No session document found for today's date.");
      }
    } catch (error) {
      console.error("Error fetching break state:", error);
    }
  };
  
  useEffect(() => {
    if (user?.uid && sessionId) {
      fetchBreakState(user, sessionId); // Call function with user and sessionId
    }
  }, [user?.uid, sessionId]);

  const handleBreakToggle = async () => {
  if (!user?.userId) return;

  const dateKey = new Date().toISOString().split("T")[0];
  const sessionRef = doc(db, "employeeDetails", user.userId, "sessions", dateKey);

  try {
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) return;

    const sessionData = sessionDoc.data();

    let updatedBreaks = sessionData.breaks || [];

    if (onBreak) {
      // End break
      updatedBreaks.push({
        breakStart: onBreak,
        breakEnd: new Date().toISOString(),
      });
      await updateDoc(sessionRef, {
        breaks: updatedBreaks,
        onBreak: null,
      });
      setOnBreak(null);
    } else {
      // Start break
      const breakStart = new Date().toISOString();
      await updateDoc(sessionRef, { onBreak: breakStart });
      setOnBreak(breakStart);
    }
  } catch (err) {
    console.error("Error updating break:", err);
  }
};





  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <section className="mainContainer">
      <div className="headerMain">
        <div className="logoN">
          <Image src={UjustbeLogo} alt="UJUSTBE Logo" width={120} height={60} />
        </div>

        {user && (
          <div className="HeaderRight">
            <nav>
              <div className="background-tabs">
                <Link href="/PolicyPage" className="m-button-2">
                  Policy Updates
                </Link> 
                <button
                  className="m-button-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  Apply Leave
                </button>
                <LeaveModal
                  isOpen={isModalOpen}
                  onRequestClose={() => setIsModalOpen(false)}
                />
              <Link href={`/user-session/${user.userId}`} className="m-button-2">
  View Your Attendance
</Link>

              </div>
            </nav>
            <UserNotifications />
          </div>
        )}
      </div>

      <div className="loginMain">
        <div className="loginLeft">
          <h1>{currentSlogan.title}</h1>
          <p>{currentSlogan.description}</p>
          <button className="m-button">
            Let&apos;s Go <MdOutlineArrowForwardIos />
          </button>
        </div>

        <div className="LoginRight">
          <div className="loginBox">
            {!user ? (
              <div className="loggedInContainer">
                <h1>Mark your Attendance</h1>
                <div className="auth-container">
                  <button
                    onClick={() => handleLogin("microsoft")}
                    className="btn"
                  >
       

                    <Image
                      src={MicrosoftLogo}
                      alt="Microsoft Logo"
                      width={30}
                      height={30}
                    />
                  </button>

                  <div className="divider">
                    <span></span>
                  </div>

                  <button
                    className="gsi-material-button"
                    onClick={() => handleLogin("google")}
                  >
                    <span className="gsi-material-button-contents">
                      Sign in with Google
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="loggedInContainer">
                <p className="greeting">
                  Welcome, {user.displayName || "Guest"}!
                </p>
                <p className="time">
                  Today&apos;s Date:{" "}
                  {loginTime &&
                    new Date(loginTime).toLocaleDateString("en-GB")}
                </p>
                <p className="time">
                  Login Time:{" "}
                  {loginTime &&
                    new Date(loginTime).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                </p>

              <div className="break-system">
  {onBreak && (
    <p className="elapsed-time">
      You are on the Break Time: {formatTime(elapsedTime)}
    </p>
  )}
  <button
    className={onBreak ? "end-break" : "start-break"}
    onClick={handleBreakToggle} // ✅ call the function that updates Firestore
  >
    {onBreak ? "End Break" : "Start Break"}
  </button>
</div>


                <button className="m-button" onClick={handleLogout}>
                  <AiOutlineLogin />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Auth;
