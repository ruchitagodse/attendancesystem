"use client"; // ✅ Required for hooks in Next.js App Router

import React, { useEffect, useState } from "react";
import { db, storage } from "../../firebaseConfig";
import { deleteDoc, doc, collection, getDocs } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import Image from "next/image"; // ✅ Optimized image
import { useRouter } from "next/router"; // ✅ For navigation
import Swal from "sweetalert2";

import logo from "../../public/videoframe_logo.png"; // ✅ Import from /public
// import Header from "../Header";
// import Navbar from "../Navbar";

const AdminManagePDF = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter(); // ✅ replaces window.history.back()

  // Fetch PDFs from Firestore
  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        setLoading(true);
        const pdfCollection = collection(db, "newpolicies");
        const snapshot = await getDocs(pdfCollection);
        const pdfList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPdfs(pdfList);
      } catch (error) {
        console.error("Error fetching PDFs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

  // Delete PDF from Firestore & Storage
  const handleDelete = async (pdfId, pdfName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${pdfName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);

        // Delete Firestore document
        await deleteDoc(doc(db, "newpolicies", pdfId));

        // Delete from Firebase Storage
        const pdfRef = ref(storage, `pdfs/${pdfName}`);
        await deleteObject(pdfRef);

        // Update UI
        setPdfs((prev) => prev.filter((pdf) => pdf.id !== pdfId));

        Swal.fire("Deleted!", `${pdfName} has been deleted.`, "success");
      } catch (error) {
        console.error("Error deleting PDF:", error);
        Swal.fire("Error!", "Error deleting Policy", "error");
      } finally {
        setLoading(false);
      }
    }
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
          <h2>Manage Policy Documents</h2>
          <button className="m-button-5" onClick={() => router.back()}>
            Back
          </button>

          {loading ? (
            <div className="loader-container">
              <svg className="load" viewBox="25 25 50 50">
                <circle r="20" cy="50" cx="50"></circle>
              </svg>
            </div>
          ) : pdfs.length > 0 ? (
            <table className="leave-requests-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>PDF Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pdfs.map((pdf, index) => (
                  <tr key={pdf.id}>
                    <td>{index + 1}</td>
                    <td>{pdf.name}</td>
                    <td>
                      <button
                        className="m-button-6"
                        onClick={() => handleDelete(pdf.id, pdf.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No PDFs uploaded yet.</p>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminManagePDF;
