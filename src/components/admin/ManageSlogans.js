import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Firebase config
import logo from '../../videoframe_logo.png';
import Header from '../Header';
import Navbar from '../Navbar';

const ManageSlogans = () => {
  const [slogans, setSlogans] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editedSlogan, setEditedSlogan] = useState({ id: '', title: '', description: '' });

  useEffect(() => {
    const fetchSlogans = async () => {
      const slogansCollection = collection(db, 'slogans');
      const sloganSnapshot = await getDocs(slogansCollection);
      const slogansList = sloganSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSlogans(slogansList);
    };
    fetchSlogans();
  }, []);

  const deleteSlogan = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this slogan?');
    if (confirmDelete) {
      await deleteDoc(doc(db, 'slogans', id));
      setSlogans(slogans.filter((slogan) => slogan.id !== id));
    }
  };

  const handleEdit = (slogan) => {
    setEditMode(true);
    setEditedSlogan({
      id: slogan.id,
      title: slogan.title,
      description: slogan.description,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedSlogan((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sloganRef = doc(db, 'slogans', editedSlogan.id);
    await updateDoc(sloganRef, {
      title: editedSlogan.title,
      description: editedSlogan.description,
    });
    setSlogans(slogans.map((slogan) => (slogan.id === editedSlogan.id ? editedSlogan : slogan)));
    setEditMode(false);
  };

  return (
    <>
      <Header />
      <div className="logoContainer">
        <img src={logo} alt="Logo" className="logos" />
      </div>
      <Navbar />
      <main className="maincontainer">
        <div className="leave-requests-container">
          <div className="leave-container">
            <h2>Manage Slogans</h2>
            <button className="m-button-5" onClick={() => window.history.back()}>
              Back
            </button>

            <div className="form-group">
              {editMode ? (
                <form onSubmit={handleSubmit} className="edit-slogan-form">
                  <h3>Edit Slogan</h3>
                  <input
                    type="text"
                    name="title"
                    value={editedSlogan.title}
                    onChange={handleChange}
                    placeholder="Edit title"
                  />
                  <textarea
                    name="description"
                    value={editedSlogan.description}
                    onChange={handleChange}
                    placeholder="Edit description"
                  ></textarea>
                  <button type="submit" className="m-button-7">
                    Save Changes
                  </button>
                  
                </form>
              ) : (
                slogans.map((slogan) => (
                  <div key={slogan.id} className="slogan">
                    <h3>{slogan.title}</h3>
                    <p>{slogan.description}</p>
                    <div className='btn-container'>
                    <button className="approve-btn" onClick={() => handleEdit(slogan)}>
                      Edit
                    </button>
                    <button className="decline-btn" onClick={() => deleteSlogan(slogan.id)}>
                      Delete
                    </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ManageSlogans;
