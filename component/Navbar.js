import React from 'react';
import { AiOutlineHome } from "react-icons/ai";
import { RiListSettingsLine } from "react-icons/ri";
import { MdLocalPostOffice, MdOutlineNoteAdd, MdEventAvailable, MdOutlineKeyboardArrowDown } from "react-icons/md";
import { TfiAnnouncement } from "react-icons/tfi";
import { FaRegUser } from "react-icons/fa";
import { IoCloudUploadOutline } from "react-icons/io5";
import { TbReportSearch } from "react-icons/tb";
import { SlCalender } from "react-icons/sl";
import { BsCake2 } from "react-icons/bs";
import Link from 'next/link';
import { useRouter } from "next/router";
import { MdOutlineLaptopChromebook } from "react-icons/md";
const Navbar = (props) => {
  const router = useRouter();

  return (
    <>
      {props.loading ? (
        <div className='loader'><span className="loader2"></span></div>
      ) : (
        <nav className={props.expand ? 'm-navbar expand' : 'm-navbar unexpand'}>
          <ul>
            {/* Event */}
            <li>
              <Link href="#">
                <span className="icons"><MdEventAvailable /></span>
                <span className="linklabel">Users</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link href="/admin/addusers">Add Users</Link></li>
                <li><Link href="/admin/ManageEmployee">List of Users</Link></li>
              </ul>
            </li>

            <li>
              <Link href="#">
                <span className="icons"><BsCake2 /></span>
                <span className="linklabel">Birthdays</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link href="/SendBirthday">Send Wishes</Link></li>
                <li><Link href="/AddBirthday">Add Wishes</Link></li>
              </ul>
            </li>

            {/* Slogans */}
            <li>
              <Link href="#">
                <span className="icons"><MdOutlineNoteAdd /></span>
                <span className="linklabel">Slogans</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link href="/add-slogan">Add Slogan</Link></li>
                <li><Link href="/manage-slogans">Manage Slogan</Link></li>
              </ul>
            </li>
  <li>
              <Link href="/admin/LeaveRequest">
                <span className="icons"><MdLocalPostOffice /></span>
                <span className="linklabel">Leave<span className="space"></span>Request</span>
             
              </Link>
            </li>
            {/* Announcement */}
            <li>
              <Link href="#">
                <span className="icons"><TfiAnnouncement /></span>
                <span className="linklabel">Announcement</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link href="/update-announcement">Add Announcement</Link></li>
                <li><Link href="/manageann">Manage Announcement</Link></li>
              </ul>
            </li>

            {/* Policy */}
            <li>
              <Link href="#">
                <span className="icons"><IoCloudUploadOutline /></span>
                <span className="linklabel">Policy</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link href="/admin/ManagePolicy">Add Policy</Link></li>
                <li><Link href="/admin/UploadPolicy">Manage Policy</Link></li>
              </ul>
            </li>
 <li>
              <Link href="#">
                <span className="icons"><MdOutlineLaptopChromebook /></span>
                <span className="linklabel">Assets</span>
                <span className="submenuIcon"><MdOutlineKeyboardArrowDown /></span>
              </Link>
              <ul>
                <li><Link href="/admin/AddAsset">Add Assets</Link></li>
                <li><Link href="/admin/AssetCategory">Manage Cateogry</Link></li>
                  <li><Link href="/admin/AssetLLog"> Assets Log</Link></li>
              </ul>
            </li>

            {/* Attendance Report */}
            <li>
              <Link href="/admin/Report">
                <span className="icons"><TbReportSearch /></span>
                <span className="linklabel">Attendance Report</span>
              </Link>
            </li>

            {/* Holiday List */}
            <li>
              <Link href="/admin/HolidayList">
                <span className="icons"><SlCalender /></span>
                <span className="linklabel">Holiday List</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
};

export default Navbar;
