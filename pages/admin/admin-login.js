import { useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import "../../src/app/styles/main.scss";


const AdminLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Predefined admin credentials
  const ADMIN_PHONE = "9820003881"; // Replace with actual phone number
  const ADMIN_PASSWORD = "admin1234"; // Replace with actual password

  const handleLogin = (e) => {
    e.preventDefault();

    if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
      localStorage.setItem("adminLoggedIn", "true"); // Store login status
      router.push("/admin/registeredusers"); // Redirect to Admin Panel
    } else {
      Swal.fire("Login Failed", "Invalid phone number or password", "error");
    }
  };



  return (   
     <div className="login-wrapper">
     
      <form onSubmit={handleLogin}  className="login-form">
      <h2>Admin Login</h2>
      <div className="input-group">
    
        <input
          type="text"
          placeholder="Admin Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        </div>
        <div className="input-group">
   
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        </div>
        <div className="input-group">
        <button type="submit" className="login-button">Login</button>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;
