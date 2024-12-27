import React, { useState, useEffect, useCallback  } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, db } from '../firebaseConfig';
import { signInWithPopup, signOut, OAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, collection, getDocs, setDoc, updateDoc, getDoc, arrayUnion, query, where, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { setUser, clearUser } from '../store/authSlice';
import './Auth.css';
import MicrosoftLogo from '../microsoft-logo.png';
import UjustbeLogo from '../videoframe_logo.png';
import LeaveModal from './LeaveModal';
import UserNotifications from './UserNotifications';
import { AiOutlineLogin } from "react-icons/ai";
import { MdOutlineArrowForwardIos } from "react-icons/md";



const Auth = () => { 
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginTime, setLoginTime] = useState(localStorage.getItem('loginTime') || null);
  const [slogans, setSlogans] = useState([]);
  const [currentSlogan, setCurrentSlogan] = useState({ title: '', description: '' });
  const [onBreak, setOnBreak] = useState(null); // Store break start time
  const [elapsedTime, setElapsedTime] = useState(0); // Time elapsed in seconds

  

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'employee', user.uid, 'notifications');
    const notificationsQuery = query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    }, (error) => {
      console.error('Error in onSnapshot:', error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const date = new Date();
    setCurrentDate(date.toLocaleDateString('en-GB'));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Update the elapsed time every second
    let timer;
    if (onBreak) {
      timer = setInterval(() => {
        const now = new Date().getTime();
        const breakStart = new Date(onBreak).getTime();
        setElapsedTime(Math.floor((now - breakStart) / 1000)); // Time in seconds
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => clearInterval(timer); // Cleanup timer
  }, [onBreak]);


  useEffect(() => {
    if (user) {
      checkAndCreateNewSession();
    
    }
  }, [user]);
  const formatDate = (date) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date).replace(',', '');
  };
  
  const checkAndCreateNewSession = async () => {
    if (!user || !user.uid) {
      console.log("No user logged in. Skipping session creation.");
      return;
    }
  
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for document ID
    const currentTime = formatDate(new Date()); // MM/DD/YYYY HH:mm:ss format
    const sessionRef = doc(db, 'employee', user.uid, 'sessions', currentDate);
  
    try {
      const sessionDoc = await getDoc(sessionRef);
  
      if (sessionDoc.exists()) {
        console.log("Session already exists for today. Fetching first login time...");
        const sessionData = sessionDoc.data();
        const firstLoginSession = sessionData.sessions[0]; // First login session of the day
  
        setLoginTime(firstLoginSession.loginTime);
        setSessionId(firstLoginSession.sessionId);
        localStorage.setItem('sessionId', firstLoginSession.sessionId);
      } else {
        console.log("No session exists for today. Creating a new session...");
  
        const newSession = {
          sessionId: new Date().toISOString(),
          loginTime: currentTime, // Formatted first login time
          logoutTime: null,
        };
  
        await setDoc(sessionRef, {
          sessions: arrayUnion(newSession),
          currentMonth: new Date().toLocaleString('default', { month: 'long' }),
        });
  
        console.log("New session created:", newSession);
        setSessionId(newSession.sessionId);
        setLoginTime(newSession.loginTime);
        localStorage.setItem('sessionId', newSession.sessionId);
        localStorage.setItem('lastSessionDate', currentDate);
      }
    } catch (error) {
      console.error("Error managing session:", error);
    }
  };
  

  const handleLogin = async () => {
    try {
        const provider = new OAuthProvider('microsoft.com');
        provider.setCustomParameters({ prompt: 'select_account' });
        await setPersistence(auth, browserSessionPersistence);

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(db, 'employee', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                displayName: user.displayName || 'Guest',
                email: user.email,
            });
        } else {
            await updateDoc(userRef, {
                displayName: user.displayName || 'Guest',
                email: user.email,
            });
        }

        dispatch(setUser(user));

        const currentDate = new Date().toISOString().split('T')[0];
        const sessionRef = doc(db, 'employee', user.uid, 'sessions', currentDate);
        const sessionDoc = await getDoc(sessionRef);

        if (sessionDoc.exists()) {
            const sessionData = sessionDoc.data();
            const firstLoginSession = sessionData.sessions[0];

            setLoginTime(firstLoginSession.loginTime);
            setSessionId(firstLoginSession.sessionId);
            localStorage.setItem('sessionId', firstLoginSession.sessionId);
            localStorage.setItem('loginTime', firstLoginSession.loginTime);  // Store the loginTime
        } else {
            const newSession = {
                sessionId: new Date().toISOString(),
                loginTime: formatDate(new Date()),  // Format login time
                logoutTime: null,
            };

            await setDoc(sessionRef, {
                sessions: arrayUnion(newSession),
                currentMonth: new Date().toLocaleString('default', { month: 'long' }),
            });

            setSessionId(newSession.sessionId);
            setLoginTime(newSession.loginTime);
            localStorage.setItem('sessionId', newSession.sessionId);
            localStorage.setItem('loginTime', newSession.loginTime);  // Store the formatted loginTime
        }

    } catch (error) {
        console.error('Error during login:', error);
    }
};


const handleLogout = async () => {
  if (!user || !user.uid) {
    console.log("No user logged in. Cannot perform logout.");
    return;
  }

  const currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
  const currentTime = new Date().toLocaleString("en-US", { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',  
    second: '2-digit',
  }); // MM/DD/YYYY HH:mm:ss format

  const sessionRef = doc(db, 'employee', user.uid, 'sessions', currentDate);

  try {
    // Get today's session document
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data();

      // Update logout time for the current session
      const updatedSessions = sessionData.sessions.map((session) => {
        if (session.sessionId === localStorage.getItem('sessionId')) {
          return { ...session, logoutTime: currentTime }; // Add logout time
        }
        return session;
      });

      // Save the updated session data back to Firestore
      await updateDoc(sessionRef, { sessions: updatedSessions });
      console.log("Logout time successfully updated in Firestore:", currentTime);
    } else {
      console.log("No session found for today. Cannot update logout time.");
    }

    // Clear local storage
    localStorage.removeItem('sessionId');
    localStorage.removeItem('lastSessionDate');

    // Clear application state
    setSessionId(null);
    setLoginTime(null);
    dispatch(setUser(null)); // Clear Redux state if using Redux

    // Sign the user out of Firebase Authentication
    await signOut(auth);
    console.log("User logged out successfully.");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};
  
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
    const sessionRef = doc(db, "employee", user.uid, "sessions", currentDate);
  
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
    const currentDate = new Date().toISOString().split("T")[0];
    const sessionRef = doc(db, "employee", user.uid, "sessions", currentDate);

    try {
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        const updatedSessions = sessionData.sessions.map((session) => {
          if (session.sessionId === sessionId) {
            if (!session.breaks) session.breaks = [];

            if (onBreak) {
              // End break
              session.breaks.push({
                breakStart: onBreak,
                breakEnd: new Date().toLocaleString(),
              });
              session.onBreak = null; // Clear onBreak field
              setOnBreak(null); // Reset local state
            } else {
              // Start break
              const breakStart = new Date().toLocaleString();
              session.onBreak = breakStart; // Save start time in Firestore
              setOnBreak(breakStart); // Set local state
            }
          }
          return session;
        });

        await updateDoc(sessionRef, { sessions: updatedSessions });
      }
    } catch (error) {
      console.error("Error toggling break:", error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
 

  useEffect(() => {
    const fetchSlogans = async () => {
      try {
        const slogansCollection = collection(db, 'slogans');
        const sloganSnapshot = await getDocs(slogansCollection);
        const slogansList = sloganSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setSlogans(slogansList);
      } catch (error) {
        console.error('Error fetching slogans:', error);
      }
    };

    fetchSlogans();
  }, []);

  useEffect(() => {
    if (slogans.length > 0) {
      const dayOfYear = new Date().getFullYear() + new Date().getDate();
      const sloganIndex = dayOfYear % slogans.length;
      setCurrentSlogan(slogans[sloganIndex]);
    }
  }, [slogans]);

 
 
  return (
    <>
      <section className='mainContainer'>
        <div className='headerMain'>
          <div className='logoN'>
            <img src={UjustbeLogo} alt="UJUSTBE Logo" />
          </div>

          {user && (
            <div className='HeaderRight'>
              <nav>

                <div className='background-tabs'>
                <Link to={"/policy"} className="m-button-2">Policy Updates</Link>
                  <button className="m-button-2" onClick={() => setIsModalOpen(true)}>
                    Apply Leave
                  </button>

                  <LeaveModal
                    isOpen={isModalOpen}
                    onRequestClose={() => setIsModalOpen(false)}
                  />
                  <Link to={`/user-session/${user.uid}`} className="m-button-2">View Your Attendance</Link>
                </div>

              </nav>
              <UserNotifications /> 
            </div>

          )}

        </div>


        <div className='loginMain'>
          <div className='loginLeft'>
          <h1>{currentSlogan.title}</h1>
          <p>{currentSlogan.description}</p>
          
                <button className="m-button">
                    Let's Go <MdOutlineArrowForwardIos />
                </button>
            
          </div>
          <div className='LoginRight'>
            <div className='loginBox'>
              {!user ? (
                <>
                  <div className="loggedInContainer">
                    <h1>Mark your Attendance</h1>
                    <button className="btn" onClick={handleLogin}>
                      <img src={MicrosoftLogo} alt="Microsoft Logo" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="loggedInContainer">
                  <p className="greeting">Welcome, {user.displayName || 'Guest'}!</p>


                  <p className="time">
                     </p>
                  <p className="time"> Login Time:  {loginTime && ` ${loginTime}`}
                  </p>
                  <div className="break-system">
      
      <div>

        {onBreak && (
          <p className="elapsed-time">You are on the Break Time: {formatTime(elapsedTime)}</p>
        )}
      </div>
      <button 
        className={onBreak ? 'end-break' : 'start-break'} 
        onClick={ handleBreakToggle}
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
    </>
  );
};

export default Auth;
