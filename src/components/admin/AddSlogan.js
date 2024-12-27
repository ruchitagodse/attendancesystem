import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Firebase config
import { useNavigate } from 'react-router-dom';
import logo from '../../videoframe_logo.png';
import Header from '../Header';
import Navbar from '../Navbar';
//import './AddSlogan.css'; // CSS for styling

const AddSlogan = () => {
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const navigate = useNavigate();

  const addSlogan = async () => {
    if (newTitle && newDescription) {
      await addDoc(collection(db, 'slogans'), {
        title: newTitle,
        description: newDescription,
      });
      navigate('/manage-slogans'); // Redirect to Manage Slogans page after adding
    }
  };

  return (
    <>
    <Header />
    <div className='logoContainer'>
      <img src={logo} alt="Logo" className="logos" />
    </div>
    <Navbar />
    <main className='maincontainer'>
    <div className="leave-requests-container">
    <div className="leave-container">
      <h2>Add New Slogan</h2>
      <button className="m-button-5" onClick={() => window.history.back()}>
    Back
  </button>
      <div className="form-group">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Slogan Title"
        />
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Slogan Description"
        ></textarea>
        <button className="m-button" onClick={addSlogan}>
          Add Slogan
        </button>
      </div>
    </div>
    </div>
    </main>
    </>
  );
};

export default AddSlogan;
