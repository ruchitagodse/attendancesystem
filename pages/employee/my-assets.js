import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";

const MyAssets = ({ userId }) => {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchMyAssets();
    }
  }, [userId]);

  const fetchMyAssets = async () => {
    // Assuming assets collection has assignedTo.userId field
    const q = query(collection(db, "assets"), where("assignedTo.userId", "==", userId));
    const snapshot = await getDocs(q);
    const assetList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAssets(assetList);
  };

  return (
    <>
      <Header />
      <Navbar />
      <main className="maincontainer">
        <div className="users-table-container">
          <h2>My Assigned Assets</h2>
          {assets.length === 0 ? (
            <p>You have no assigned assets.</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>View Details</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>{asset.id}</td>
                    <td>{asset.name}</td>
                    <td>{asset.category}</td>
                    <td>{asset.status}</td>
                    <td>
                      <a href={`/asset/${asset.id}`} target="_blank">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
};

export default MyAssets;
