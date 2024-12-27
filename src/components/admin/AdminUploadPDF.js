import React, { useState } from 'react';
import { storage, db } from '../../firebaseConfig';  
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';  
import { collection, addDoc } from 'firebase/firestore';
import logo from '../../videoframe_logo.png';
import Header from '../Header';
import Swal from 'sweetalert2';
import Navbar from '../Navbar';

const AdminUploadPDF = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            console.log('File selected:', selectedFile);
        } else {
            setMessage('Please select a valid PDF file.');
            setFile(null); // Reset the file if invalid
        }
    };

    const handleUpload = async () => {
        if (!file) {
            console.log('No file selected');
            setMessage('Please select a file first.');
            return;
        }
    
        console.log('Starting upload for:', file.name);
        setLoading(true);
        setUploadProgress(0); // Reset progress
    
        const storageRef = ref(storage, `pdfs/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
    
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                setMessage('Error uploading file: ' + error.message);
                console.error('Upload error:', error);
                setLoading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(storageRef);
                console.log('File uploaded. Download URL:', downloadURL);
    
                try {
                    // Calculate the date 15 days from now
                    const currentDate = new Date();
                    const highlightUntil = new Date();
                    highlightUntil.setDate(currentDate.getDate() + 15);
    
                    await addDoc(collection(db, 'policies'), {
                        name: file.name,
                        url: downloadURL,
                        createdAt: currentDate,
                        highlightUntil,
                    });
    
                    Swal.fire({
                        title: 'Success!',
                        text: 'File Uploaded successfully',
                        icon: 'success',
                        confirmButtonText: 'OK',
                    });
                } catch (error) {
                    console.error('Error saving file URL to Firestore:', error);
                    setMessage('Error saving file URL: ' + error.message);
                }
    
                setLoading(false);
                setFile(null);
                setUploadProgress(0); // Reset progress after upload
            }
        );
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
                        <h2>Upload Policy Document</h2>
                        <button className="m-button-5" onClick={() => window.history.back()}>
                            Back
                        </button>
                        <div className="form-group">
                            <input type="file" onChange={handleFileChange} />
                        </div>

                        {/* Show loading text or loader during upload */}
                        {loading ? (
                            <>
                                <p>Uploading...</p>
                                <p>Upload Progress: {uploadProgress.toFixed(2)}%</p> {/* Display progress */}
                            </>
                        ) : (
                            <button className="m-button" onClick={handleUpload}>
                                Upload PDF
                            </button>
                        )}

                        <p>{message}</p>
                    </div>
                </div>
            </main>
        </>
    );
};

export default AdminUploadPDF;
