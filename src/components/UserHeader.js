import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import UserNotifications from './UserNotifications';
import UjustbeLogo from '../videoframe_logo.png';
import { Link } from 'react-router-dom';
import LeaveModal from './LeaveModal';
import { useNavigate } from 'react-router-dom'; 
import './UserHeader.css';

const UserHeader = () => {
  const user = useSelector((state) => state.auth.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // New state to detect scroll
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div className={`headerMain ${isScrolled ? 'scrolled' : ''}`}>
        <div className="logoN">
          <button className="hide" onClick={handleBack}>
            <img src={UjustbeLogo} alt="UJUSTBE Logo" />
          </button>
        </div>

        {user && (
          <div className="HeaderRight">
            <nav>
              <div className="background-tabs">
              <Link to={"/policy"} className="m-button-2">Policy Updates</Link>
                <button className="m-button-2" onClick={() => setIsModalOpen(true)}>
                  Apply Leave
                </button>

                <LeaveModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} />

                <Link to={`/user-session/${user.uid}`} className="m-button-2">
                  View Your Attendance
                </Link>
              </div>
            </nav>
            <UserNotifications />
          </div>
        )}
      </div>
    </>
  );
};

export default UserHeader;
