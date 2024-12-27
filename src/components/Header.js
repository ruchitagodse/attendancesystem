import React from 'react';
import { useNavigate } from 'react-router-dom'; // Use this for navigation
import { BiLogOutCircle } from 'react-icons/bi';
import Swal from 'sweetalert2';





const Header = () => {
    const navigate = useNavigate(); // Initialize navigation hook
    const handleLogout=()=>{

        Swal.fire({
            title: 'Logout!',
            text: "Are you sure you want to logout?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes'
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.fire({
                position: 'middle',
                icon: 'success',
                title: 'Logout',
                showConfirmButton: false,
                timer: 1500

              }) 
              
              localStorage.removeItem("ucoreadmin");
              navigate("/admin-login");      
                
             
            }},
           )  
        
    }

    return (
        <header className="wrapper admin-header">      {/* header */}
        <div className="headerLeft"> 
                        
        </div>
        <div className="headerRight">
            
            {/* <button className="profile">
                <span>Logout</span>
            </button> */}
             {/* <div>
                <span><IoMdLogIn /></span>
                <Link href="/admin/login">
                     <a>Login</a>
                </Link>
               
           </div> */}
            <div>
                <span onClick={handleLogout} className='icon-rotate-90'><BiLogOutCircle /></span>
                Logout
           </div>
          
        </div>
     </header>
    )
}



export default Header;
