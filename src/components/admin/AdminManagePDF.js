import React, { useEffect, useState } from 'react';
import { db, storage } from '../../firebaseConfig';  
import { deleteDoc, doc, collection, getDocs } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import logo from '../../videoframe_logo.png';
import Header from '../Header';
import Swal from 'sweetalert2';
import Navbar from '../Navbar';

const AdminManagePDF = () => {
    const [pdfs, setPdfs] = useState([]);
    const [loading, setLoading] = useState(false); // Loader state

    // Fetch PDFs from Firestore
    useEffect(() => {
        const fetchPDFs = async () => {
            setLoading(true);  // Start loader
            const pdfCollection = collection(db, 'policies');
            const snapshot = await getDocs(pdfCollection);
            const pdfList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPdfs(pdfList);
            setLoading(false);  // Stop loader
        };

        fetchPDFs();
    }, []);

    // Delete PDF from Firestore and Storage
    const handleDelete = async (pdfId, pdfName) => {
        // Display Swal confirmation dialog
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete ${pdfName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        });
    
        // If the user confirms, proceed with deletion
        if (result.isConfirmed) {
            try {
                setLoading(true);  // Start loader when deleting
                
                // Delete from Firestore
                await deleteDoc(doc(db, 'policies', pdfId));
    
                // Create a reference to the file to delete in Firebase Storage
                const pdfRef = ref(storage, `pdfs/${pdfName}`);
                await deleteObject(pdfRef);
    
                // Remove the deleted PDF from the list
                setPdfs(prevPdfs => prevPdfs.filter(pdf => pdf.id !== pdfId));
                
                // Show success message
                Swal.fire({
                    title: 'Deleted!',
                    text: `${pdfName} has been deleted.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
    
            } catch (error) {
                console.error('Error deleting PDF:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Error deleting Policy',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            } finally {
                setLoading(false);  // Stop loader after deletion
            }
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
            <h2>Manage Policy Documents</h2>
            <button className="m-button-5" onClick={() => window.history.back()}>
                Back
            </button>
            {loading ? (
               <div className="loader-container">
               <svg className="load" viewBox="25 25 50 50">
                 <circle r="20" cy="50" cx="50"></circle>
               </svg>
             </div>
            ) : (
                pdfs.length > 0 ? (
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
                                        <button className="m-button-6" onClick={() => handleDelete(pdf.id, pdf.name)}>
                                            {loading ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No PDFs uploaded yet.</p>
                )
            )}
        </div>
        </main>
        </>
    );
};

export default AdminManagePDF;
