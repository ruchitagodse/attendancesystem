import React, { useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";

// react-qr-reader needs to be dynamically imported because it uses window
const QrReader = dynamic(() => import("react-qr-reader"), { ssr: false });

const ScanAsset = () => {
  const [scanResult, setScanResult] = useState("");
  const router = useRouter();

  const handleScan = (data) => {
    if (data) {
      setScanResult(data);
      router.push(`/asset/${data}`); // Redirect to asset detail page
    }
  };

  const handleError = (err) => {
    console.error(err);
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
          {scanResult && <p>Scanned Asset ID: {scanResult}</p>}
        </div>
      </main>
    </>
  );
};

export default ScanAsset;
