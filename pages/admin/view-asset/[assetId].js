import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../../../firebaseConfig";
import { doc, getDoc, collection, getDocs, query, orderBy, where } from "firebase/firestore";
import Header from "../../../component/Header";
import Navbar from "../../../component/Navbar";
import QRCode from "qrcode.react";

const ViewAsset = () => {
  const router = useRouter();
  const { assetId } = router.query;

  const [asset, setAsset] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch asset info
  useEffect(() => {
    if (assetId) {
      fetchAsset();
      fetchAssetLogs();
    }
  }, [assetId]);

  const fetchAsset = async () => {
    const assetRef = doc(db, "assets", assetId);
    const snapshot = await getDoc(assetRef);
    if (snapshot.exists()) {
      setAsset(snapshot.data());
    }
  };

  const fetchAssetLogs = async () => {
    const logsQuery = query(
      collection(db, "assetLogs"),
      where("assetId", "==", assetId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(logsQuery);
    const logList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setLogs(logList);
  };

  if (!asset) return <p>Loading asset details...</p>;

  return (
    <>
      <Header />
      <Navbar />
      <main className="maincontainer">
        <div className="users-table-container">
          <h2>Asset Details: {assetId}</h2>

          {/* Asset Info */}
          <div className="asset-info">
            <div>
              <strong>Name:</strong> {asset.name}
            </div>
            <div>
              <strong>Category:</strong> {asset.category}
            </div>
            <div>
              <strong>Status:</strong> {asset.status}
            </div>
            <div>
              <strong>Assigned To:</strong>{" "}
              {asset.assignedTo?.name || "Not assigned"}
            </div>
            <div>
              <strong>Description:</strong> {asset.description || "-"}
            </div>
            <div>
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
            <div style={{ marginTop: "10px" }}>
              <strong>QR Code:</strong>
              <QRCode value={assetId} size={128} />
            </div>
          </div>

          {/* Asset Logs */}
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
                      <td>{log.timestamp.toDate().toLocaleString()}</td>
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
