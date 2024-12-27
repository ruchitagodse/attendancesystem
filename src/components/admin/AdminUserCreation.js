import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; // Adjust the path as necessary


const AdminUserCreation = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User'); // Default role
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user details in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role,
        createdAt: new Date().toISOString(),
      });

      setSuccess('User created successfully!');
      setError('');
      // Clear the input fields after success
      setEmail('');
      setPassword('');
      setRole('User');
    } catch (err) {
      setError('Error creating user: ' + err.message);
      setSuccess('');
    }
  };

  return (
    <div className="login-wrapper">
      <form onSubmit={handleCreateUser} className="login-form">
        <h2>Create New User</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div className="input-group">
          <label htmlFor="email">Email:<sup>*</sup></label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password:<sup>*</sup></label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role:<sup>*</sup></label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
            <option value="HR">HR</option>
          </select>
        </div>
        <button className="login-button" type="submit" >Create User</button>
      </form>
    </div>
  );
};

export default AdminUserCreation;
