export const dynamic = "force-dynamic";

import { useState } from "react";
import { db, storage } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditEmployee({ employee, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);

  // ✅ Safe optional chaining to prevent crash
  const [personalInfo, setPersonalInfo] = useState(employee?.personalInfo || {});
  const [kycDetails, setKycDetails] = useState(employee?.kycDetails || {});
  const [hrDetails, setHrDetails] = useState(employee?.hrDetails || {});

  // ---------- Handle Changes ----------
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleKycChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (["experienceLetters", "payslips", "certifications", "relievingLetters"].includes(name)) {
        setKycDetails((prev) => ({ ...prev, [name]: Array.from(files) }));
      } else {
        setKycDetails((prev) => ({ ...prev, [name]: files[0] }));
      }
    } else {
      setKycDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleHrChange = (e) => {
    const { name, value } = e.target;
    setHrDetails((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- Upload file ----------
  const uploadFile = async (file, folderName) => {
    if (!file) return null;
    const storageRef = ref(storage, `${folderName}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!employee?.personalInfo?.mobile) {
      alert("❌ Employee mobile number missing — cannot update!");
      return;
    }

    setLoading(true);

    try {
      const uploadedFiles = { ...kycDetails };

      // Upload single files
      for (let key of Object.keys(kycDetails)) {
        if (kycDetails[key] instanceof File) {
          if (["experienceLetters", "payslips", "certifications", "relievingLetters"].includes(key))
            continue; // handled separately
          uploadedFiles[key] = await uploadFile(kycDetails[key], key);
        }
      }

      // Upload multiple files
      for (let key of ["experienceLetters", "payslips", "certifications", "relievingLetters"]) {
        if (kycDetails[key] && Array.isArray(kycDetails[key]) && kycDetails[key][0] instanceof File) {
          uploadedFiles[key] = await Promise.all(
            kycDetails[key].map((file) => uploadFile(file, key))
          );
        }
      }

      // ---------- Update Firestore ----------
      await setDoc(doc(db, "employeeDetails", employee.personalInfo.mobile), {
        personalInfo,
        kycDetails: uploadedFiles,
        hrDetails,
        updatedAt: new Date(),
      });

      alert("✅ Employee updated successfully!");
      onUpdate({ ...employee, personalInfo, kycDetails: uploadedFiles, hrDetails });
      onClose();
    } catch (err) {
      console.error("Error updating employee:", err);
      alert("❌ Error updating employee!");
    }

    setLoading(false);
  };

  // ---------- Guard ----------
  if (!employee) {
    return <div className="loading-message">Loading employee data...</div>;
  }

  // ---------- Render ----------
  return (
    <div className="edit-employee-modal">
      <h2>Edit Employee: {personalInfo?.name || "Unnamed"}</h2>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "personal" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("personal")}
        >
          Personal Info
        </button>
        <button
          className={activeTab === "kyc" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("kyc")}
        >
          KYC
        </button>
        <button
          className={activeTab === "hr" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("hr")}
        >
          HR Details
        </button>
      </div>

      {/* Personal Info */}
      {activeTab === "personal" && (
        <div className="form-grid">
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={personalInfo?.name || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={personalInfo?.email || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Mobile:
            <input
              type="text"
              name="mobile"
              value={personalInfo?.mobile || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Alt Mobile:
            <input
              type="text"
              name="altMobile"
              value={personalInfo?.altMobile || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Date of Birth:
            <input
              type="date"
              name="dob"
              value={personalInfo?.dob || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Gender:
            <select name="gender" value={personalInfo?.gender || ""} onChange={handlePersonalChange}>
              <option value="">-- Select --</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Marital Status:
            <select
              name="maritalStatus"
              value={personalInfo?.maritalStatus || ""}
              onChange={handlePersonalChange}
            >
              <option value="">-- Select --</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
            </select>
          </label>

          {personalInfo?.maritalStatus === "married" && (
            <>
              <label>
                Spouse Name:
                <input
                  type="text"
                  name="spouseName"
                  value={personalInfo?.spouseName || ""}
                  onChange={handlePersonalChange}
                />
              </label>
              <label>
                Children Count:
                <input
                  type="number"
                  name="childrenCount"
                  value={personalInfo?.childrenCount || ""}
                  onChange={handlePersonalChange}
                />
              </label>
            </>
          )}

          <label>
            Father:
            <input
              type="text"
              name="father"
              value={personalInfo?.father || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Mother:
            <input
              type="text"
              name="mother"
              value={personalInfo?.mother || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Company:
            <input
              type="text"
              name="company"
              value={personalInfo?.company || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Department:
            <input
              type="text"
              name="department"
              value={personalInfo?.department || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Designation:
            <input
              type="text"
              name="designation"
              value={personalInfo?.designation || ""}
              onChange={handlePersonalChange}
            />
          </label>
          <label>
            Status:
            <select name="status" value={personalInfo?.status || ""} onChange={handlePersonalChange}>
              <option value="working">Working</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
            </select>
          </label>
        </div>
      )}

      {/* KYC */}
      {activeTab === "kyc" && (
        <div className="form-grid">
          {["aadhaarFile", "panFile", "passportFile", "voterIdFile", "profilePhoto"].map((key) => (
            <label key={key}>
              {key}:
              <input type="file" name={key} onChange={handleKycChange} />
              {kycDetails?.[key] && typeof kycDetails[key] === "string" ? (
                <p>
                  Existing:{" "}
                  <a href={kycDetails[key]} target="_blank" rel="noreferrer">
                    {kycDetails[key].split("/").pop()}
                  </a>
                </p>
              ) : kycDetails?.[key] instanceof File ? (
                <p>New: {kycDetails[key].name}</p>
              ) : null}
            </label>
          ))}

          {["experienceLetters", "payslips", "certifications", "relievingLetters"].map((key) => (
            <label key={key}>
              {key}:
              <input type="file" name={key} multiple onChange={handleKycChange} />
              {kycDetails?.[key] &&
                Array.isArray(kycDetails[key]) &&
                kycDetails[key].map((f, i) => (
                  <p key={i}>
                    {typeof f === "string" ? (
                      <a href={f} target="_blank" rel="noreferrer">
                        {f.split("/").pop()}
                      </a>
                    ) : (
                      f.name
                    )}
                  </p>
                ))}
            </label>
          ))}

          <label>
            Bank Details / Cancelled Cheque:
            <textarea
              name="bankDetails"
              value={kycDetails?.bankDetails || ""}
              onChange={handleKycChange}
            ></textarea>
          </label>
          <label>
            Medical Certificate:
            <textarea
              name="medicalCertificateText"
              value={kycDetails?.medicalCertificateText || ""}
              onChange={handleKycChange}
            ></textarea>
          </label>
        </div>
      )}

      {/* HR Details */}
      {activeTab === "hr" && (
        <div className="form-grid">
          <label>
            Probation Period:
            <input
              type="date"
              name="probationPeriod"
              value={hrDetails?.probationPeriod || ""}
              onChange={handleHrChange}
            />
          </label>
          <label>
            Confirmation Date:
            <input
              type="date"
              name="confirmationDate"
              value={hrDetails?.confirmationDate || ""}
              onChange={handleHrChange}
            />
          </label>
          <label>
            Reporting Manager:
            <input
              type="text"
              name="reportingManager"
              value={hrDetails?.reportingManager || ""}
              onChange={handleHrChange}
            />
          </label>
          <label>
            Offer Letter:
            <input type="file" name="offerLetter" onChange={handleKycChange} />
          </label>
          <label>
            Relieving / NOC Letters:
            <input type="file" name="relievingLetters" multiple onChange={handleKycChange} />
          </label>
        </div>
      )}

      <div className="actions">
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Updating..." : "Update Employee"}
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
