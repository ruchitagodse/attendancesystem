import React from 'react';
import { useNavigate } from 'react-router-dom'; // Use this for navigation
import { MdArrowBack } from "react-icons/md";
import Swal from 'sweetalert2';



const Header = () => {
    const navigate = useNavigate(); // Initialize navigation hook

    const handleBack = () => {
        navigate(-1);  // Navigate back to the previous page
      };

    return (
        <header className="wrapper m-header">
            <div className="headerLeft">
                {/* Add content or logo here */}
            </div>
            <div className="headerRight">
                <button onClick={handleBack} >
                    <span className='icons'><MdArrowBack /></span>Go Back
                </button>
            </div>
        </header>
    );
}

export default Header;
