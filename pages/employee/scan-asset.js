import React, { useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";

// Dynamically import react-qr-scanner
const QrScanner = dynamic(() => import("react-qr-scanner"), { ssr: false });

const ScanAsset = () => {
  const [scanResult, setScanResult] = useState("");
  const router = useRouter();

  const handleScan = (result) => {
    if (result) {
      const scannedValue = result?.text || result; // handle different formats
      setScanResult(scannedValue);
      router.push(`/asset/${scannedValue}`);
    }
  };

  const handleError = (err) => {
    console.error("QR Scan Error:", err);
  };

  const previewStyle = {
    height: 300,
    width: "100%",
    borderRadius: "10px",
    overflow: "hidden",
  };

  return (
    <>
      <Header />
      <Navbar />
      <main className="maincontainer">
        <div className="users-table-container">
          <h2>Scan Asset QR Code</h2>

          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={previewStyle}
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
