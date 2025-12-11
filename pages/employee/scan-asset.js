import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";

let Html5QrcodeScanner;

if (typeof window !== "undefined") {
  Html5QrcodeScanner = require("html5-qrcode").Html5QrcodeScanner;
}

const ScanAsset = () => {
  const [scanResult, setScanResult] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!Html5QrcodeScanner) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.clear();
        router.push(`/asset/${decodedText}`);
      },
      (err) => {
        console.error("QR Scan Error:", err);
      }
    );
  }, []);

  return (
    <>
      <Header />
      <Navbar />

      <main className="maincontainer">
        <div className="users-table-container">
          <h2>Scan Asset QR Code</h2>

          {/* QR Scanner Box */}
          <div id="qr-reader" style={{ width: "100%" }}></div>

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
