import React from 'react';
import { Link } from 'react-router-dom';
import { MdLocalPostOffice, MdOutlineNoteAdd, MdOutlineKeyboardArrowDown } from "react-icons/md";
import { TfiAnnouncement } from "react-icons/tfi";
import { FaRegUser } from "react-icons/fa";
import { IoCloudUploadOutline } from "react-icons/io5";
import { TbReportSearch } from "react-icons/tb";
import { SlCalender } from "react-icons/sl";

const Navbar = ({ pendingCount, loading, expand }) => {
  return (
    <>
      {loading ? (
        <div className='loader'><span className="loader2"></span></div>
      ) : (
        <nav className={expand ? 'm-navbar expand' : 'm-navbar unexpand'}>
          <ul>
            <li>
              <Link to="/admin-panel">
                <span className="icons"><FaRegUser /></span>
                <span className="linklabel">Users<span className="space"></span>List</span>
              </Link>
            </li>

            <li>
              <Link to="">
                <span className="icons"><MdOutlineNoteAdd /></span>
                <span className="linklabel">Slogans</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link to="/add-slogan">Add Slogan</Link></li>
                <li><Link to="/manage-slogans">Manage Slogan</Link></li>
              </ul>
            </li>

            <li>
              <Link to="">
                <span className="icons"><TfiAnnouncement /></span>
                <span className="linklabel">Announcement</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link to="/update-announcement">Add Announcement</Link></li>
                <li><Link to="/manageann">Manage Announcement</Link></li>
              </ul>
            </li>

            <li>
              <Link to="">
                <span className="icons"><IoCloudUploadOutline /></span>
                <span className="linklabel">Policy</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link to="/uploadpdf">Add Policy</Link></li>
                <li><Link to="/managepdf">Manage Policy</Link></li>
              </ul>
            </li>

            <li>
              <Link to="/leave-requests">
                <span className="icons"><MdLocalPostOffice /></span>
                <span className="linklabel">Leave<span className="space"></span>Request</span>
                {pendingCount > 0 && (
                  <span className="notification-badge">{pendingCount}</span>
                )}
              </Link>
            </li>
            <li>
              <Link to="/report">
                <span className="icons"><TbReportSearch/></span>
                <span className="linklabel">Attendance<span className="space"></span>Report</span>
               
              </Link>
            </li>
            <li>
              <Link to="/holiday">
                <span className="icons"><SlCalender/></span>
                <span className="linklabel">Holiday<span className="space"></span>List</span>
               
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
};

export default Navbar;
