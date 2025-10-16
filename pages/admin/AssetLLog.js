import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";
import "../../src/app/styles/main.scss";
import "../../src/app/styles/addUser.scss";

const AssetLogs = ({ selectedAssetId }) => {
  const [assets, setAssets] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [selectedAssetName, setSelectedAssetName] = useState("");

  useEffect(() => {
    fetchAssets();
  }, []);

  // Fetch all assets with their logs
  const fetchAssets = async () => {
    const snapshot = await getDocs(collection(db, "assets"));
    const assetList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAssets(assetList);
  };

  // Show logs for a specific asset
  const handleViewLogs = (asset) => {
    setSelectedLogs(asset.logs || []);
    setSelectedAssetName(asset.name || asset.id);
  };

  return (
    <>
      <Header />
      <Navbar />
      <main className="maincontainer">
        <div className="users-table-container">
          <h2>All Assets</h2>
          <table className="users-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.id}</td>
                  <td>{asset.name}</td>
                  <td>{asset.status}</td>
                  <td>
                    <button onClick={() => handleViewLogs(asset)}>
                      View Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedLogs.length > 0 && (
            <div className="logs-container" style={{ marginTop: "20px" }}>
              <h3>Logs for: {selectedAssetName}</h3>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Employee</th>
                    <th>Performed By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLogs.map((log, index) => (
                    <tr key={index}>
                      <td>{log.action}</td>
                      <td>{log.employee || "-"}</td>
                      <td>{log.performedBy}</td>
                      <td>
                        {log.timestamp?.toDate
                          ? log.timestamp.toDate().toLocaleString()
                          : new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AssetLogs;

