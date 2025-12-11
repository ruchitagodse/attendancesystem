import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../../../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";

import Header from "../../../component/Header";
import Navbar from "../../../component/Navbar";
import QRCode from "qrcode.react";

const ViewAsset = () => {
  const router = useRouter();
  const { assetId } = router.query;

  const [asset, setAsset] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!assetId) return;

    fetchAsset();
    fetchAssetLogs();
  }, [assetId]);

  // Fetch asset details
  const fetchAsset = async () => {
    try {
      const assetRef = doc(db, "assets", assetId);
      const snapshot = await getDoc(assetRef);

      if (snapshot.exists()) {
        setAsset(snapshot.data());
      } else {
        setAsset(null);
      }
    } catch (err) {
      console.error("Error fetching asset:", err);
    }
  };

  // Fetch asset movement logs
  const fetchAssetLogs = async () => {
    try {
      const logsQuery = query(
        collection(db, "assetLogs"),
        where("assetId", "==", assetId),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(logsQuery);
      setLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  if (!asset) {
    return (
      <>
        <Header />
        <Navbar />
        <main className="maincontainer">
          <p>Loading asset details...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="maincontainer">
        <div className="users-table-container">
          <h2>Asset Details: {assetId}</h2>

          {/* Asset Information */}
          <div className="asset-info">
            <p><strong>Name:</strong> {asset.name}</p>
            <p><strong>Category:</strong> {asset.category}</p>
            <p><strong>Status:</strong> {asset.status}</p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {asset.assignedTo?.name || "Not assigned"}
            </p>
            <p><strong>Description:</strong> {asset.description || "-"}</p>

            <div style={{ marginTop: "10px" }}>
              <strong>Image:</strong>
              {asset.imageURL ? (
                <img
                  src={asset.imageURL}
                  alt={asset.name}
                  style={{ width: "200px", marginTop: "10px" }}
                />
              ) : (
                <span> No image</span>
              )}
            </div>

            <div style={{ marginTop: "15px" }}>
              <strong>QR Code:</strong>
              <div style={{ marginTop: "10px" }}>
                <QRCode value={assetId} size={128} />
              </div>
            </div>
          </div>

          {/* Asset Logs Section */}
          <div style={{ marginTop: "30px" }}>
            <h3>Asset Journey Logs</h3>

            {logs.length === 0 ? (
              <p>No logs available for this asset.</p>
            ) : (
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
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.action}</td>
                      <td>{log.employee || "-"}</td>
                      <td>{log.performedBy}</td>
                      <td>{log.timestamp?.toDate().toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default ViewAsset;
