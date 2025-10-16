"use client"; // ✅ Needed for client-side hooks

import React, { useState } from "react";
import { storage, db } from "../../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import Image from "next/image"; // ✅ Next.js optimized image
import { useRouter } from "next/router"; // ✅ Navigation for Next.js
import Swal from "sweetalert2";

import logo from "../../public/videoframe_logo.png"; // ✅ Import from public
// import Header from "../Header";
// import Navbar from "../Navbar";

const AdminUploadPDF = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const router = useRouter(); // ✅ for navigation

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setMessage("");
    } else {
      setMessage("Please select a valid PDF file.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `pdfs/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setMessage("Error uploading file: " + error.message);
        setLoading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(storageRef);

        try {
          const currentDate = new Date();
          const highlightUntil = new Date();
          highlightUntil.setDate(currentDate.getDate() + 15);

          await addDoc(collection(db, "newpolicies"), {
            name: file.name,
            url: downloadURL,
            createdAt: currentDate,
            highlightUntil,
          });

          Swal.fire({
            title: "Success!",
            text: "File uploaded successfully",
            icon: "success",
            confirmButtonText: "OK",
          });
        } catch (error) {
          setMessage("Error saving file URL: " + error.message);
        }

        setLoading(false);
        setFile(null);
        setUploadProgress(0);
      }
    );
  };

  return (
    <>
      {/* <Header /> */}
      <div className="logoContainer">
        <Image src={logo} alt="Logo" className="logos" />
      </div>
      {/* <Navbar /> */}

      <main className="maincontainer">
        <div className="leave-requests-container">
          <div className="leave-container">
            <h2>Upload Policy Document</h2>
            <button className="m-button-5" onClick={() => router.back()}>
              Back
            </button>

            <div className="form-group">
              <input type="file" onChange={handleFileChange} />
            </div>

            {loading ? (
              <>
                <p>Uploading...</p>
                <p>Upload Progress: {uploadProgress.toFixed(2)}%</p>
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
