import React, { useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";

// Dynamic import
const QrReader = dynamic(() => import("react-qr-reader-es"), { ssr: false });

const ScanAsset = () => {
  const [scanResult, setScanResult] = useState("");
  const router = useRouter();

  const handleScan = (data) => {
    if (data) {
      setScanResult(data);
      router.push(`/asset/${data}`);
    }
  };

  const handleError = (err) => {
    console.error("QR Error:", err);
  };

  return (
    <>
      <Header />
      <Navbar />
      <main className="maincontainer">
        <div className="users-table-container">
          <h2>Scan Asset QR Code</h2>

          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%" }}
          />

          {scanResult && (
            <p style={{ marginTop: "10px" }}>
              Scanned Asset ID: <strong>{scanResult}</strong>
            </p>
          )}
        </div>
      </main>
    </>
  );
};

export default ScanAsset;
