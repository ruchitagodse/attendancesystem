"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserNotifications from "../pages/UserNotifications";
import UjustbeLogo from "../public/videoframe_logo.png";
import LeaveModal from "../pages/LeaveModal";
import "../src/app/styles/page/_UserHeader.scss";

const UserHeader = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={`headerMain ${isScrolled ? "scrolled" : ""}`}>
      <div className="logoN">
        <button className="hide" onClick={handleBack}>
          <img src={UjustbeLogo.src} alt="UJUSTBE Logo" />
        </button>
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

              <Link href={`/user-session/${user.uid}`} className="m-button-2">
                View Your Attendance
              </Link>
            </div>
          </nav>

          <UserNotifications user={user} />
        </div>
      )}
    </div>
  );
};

export default UserHeader;
