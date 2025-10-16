"use client";

import React from "react";
import { BiLogOutCircle } from "react-icons/bi";
import Swal from "sweetalert2";
import { useRouter } from "next/router"; // ✅ Next.js navigation

const Header = () => {
  const router = useRouter(); // ✅ Next.js hook

  const handleLogout = () => {
    Swal.fire({
      title: "Logout!",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          position: "middle",
          icon: "success",
          title: "Logout",
          showConfirmButton: false,
          timer: 1500,
        });

        localStorage.removeItem("ucoreadmin");

        // ✅ Redirect with Next.js router
        router.push("/admin-login");
      }
    });
  };

  return (
    <header className="wrapper admin-header">
      <div className="headerLeft"></div>
      <div className="headerRight">
        <div>
          <span
            onClick={handleLogout}
            className="icon-rotate-90"
            style={{ cursor: "pointer" }}
          >
            <BiLogOutCircle />
          </span>
          Logout
        </div>
      </div>
    </header>
  );
};

export default Header;
