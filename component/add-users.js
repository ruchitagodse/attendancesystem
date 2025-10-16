import { useState, useEffect } from "react";
import { db, storage } from "../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../src/app/styles/addUser.scss";

export default function AddUser() {
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [searchManager, setSearchManager] = useState("");

  // ---------- Personal Info State ----------
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    mobile: "",
    altMobile: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    spouseName: "",
    childrenCount: "",
    father: "",
    mother: "",
    company: "",
    department: "",
    designation: "",
    status: "working",
    joiningDate: "",
    employeeId: "",
    reportingManager: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    bloodGroup: "",
    address: "",
    nationality: "",
  });

  // ---------- KYC State ----------
  const [kycDetails, setKycDetails] = useState({
    aadhaarFile: null,
    aadhaarNumber: "",
    panFile: null,
    panNumber: "",
    passportFile: null,
    passportNumber: "",
    voterIdFile: null,
    voterIdNumber: "",
    profilePhoto: null,
    experienceLetters: [],
    payslips: [],
    certifications: [],
    cancelledCheque: null,
    bankAccountNumber: "",
    medicalCertificate: null,
    offerLetter: null,
    relievingLetters: [],
  });

  // ---------- HR Details State ----------
  const [hrDetails, setHrDetails] = useState({
    probationPeriod: "",
    confirmationDate: "",
    deviceAssigned: "",
    skills: "",
    languagesKnown: "",
    remarks: "",
  });

  // ---------- Fetch employees for reporting manager ----------
  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employeeDetails"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().personalInfo.name,
      }));
      setEmployees(data);
    };
    fetchEmployees();
  }, []);

  // ---------- Handle changes ----------
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleKycChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (name === "experienceLetters" || name === "payslips" || name === "certifications" || name === "relievingLetters") {
        setKycDetails(prev => ({ ...prev, [name]: Array.from(files) }));
      } else {
        setKycDetails(prev => ({ ...prev, [name]: files[0] }));
      }
    } else {
      setKycDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleHrChange = (e) => {
    const { name, value } = e.target;
    setHrDetails(prev => ({ ...prev, [name]: value }));
  };

  // ---------- Upload file ----------
  const uploadFile = async (file, folderName) => {
    if (!file) return null;
    const storageRef = ref(storage, `${folderName}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // ---------- Form Validation ----------
  const validateForm = () => {
    let newErrors = {};
    if (!personalInfo.name.trim()) newErrors.name = "Name is required";
    if (!personalInfo.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Valid email is required";
    if (!personalInfo.mobile.match(/^[0-9]{10}$/))
      newErrors.mobile = "Valid 10-digit mobile is required";
    if (!personalInfo.department.trim()) newErrors.department = "Department required";
    if (!personalInfo.designation.trim()) newErrors.designation = "Designation required";
    if (!personalInfo.dob) newErrors.dob = "Date of Birth required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!validateForm()) return alert("Please fix errors before submitting");
    setLoading(true);

    try {
      // ---------- Upload KYC Files ----------
      const uploadedFiles = {
        aadhaarFile: await uploadFile(kycDetails.aadhaarFile, "aadhaar"),
        panFile: await uploadFile(kycDetails.panFile, "pan"),
        passportFile: await uploadFile(kycDetails.passportFile, "passport"),
        voterIdFile: await uploadFile(kycDetails.voterIdFile, "voterId"),
        profilePhoto: await uploadFile(kycDetails.profilePhoto, "profilePhotos"),
        experienceLetters: await Promise.all(
          kycDetails.experienceLetters.map(file => uploadFile(file, "experienceLetters"))
        ),
        payslips: await Promise.all(
          kycDetails.payslips.map(file => uploadFile(file, "payslips"))
        ),
        certifications: await Promise.all(
          kycDetails.certifications.map(file => uploadFile(file, "certifications"))
        ),
        cancelledCheque: await uploadFile(kycDetails.cancelledCheque, "cancelledCheques"),
        medicalCertificate: await uploadFile(kycDetails.medicalCertificate, "medicalCertificates"),
        offerLetter: await uploadFile(kycDetails.offerLetter, "offerLetters"),
        relievingLetters: await Promise.all(
          kycDetails.relievingLetters.map(file => uploadFile(file, "relievingLetters"))
        ),
      };

      // ---------- Save to Firestore ----------
      await setDoc(doc(db, "employeeDetails", personalInfo.mobile), {
        personalInfo,
        kycDetails: { ...uploadedFiles, ...{
          aadhaarNumber: kycDetails.aadhaarNumber,
          panNumber: kycDetails.panNumber,
          passportNumber: kycDetails.passportNumber,
          voterIdNumber: kycDetails.voterIdNumber,
          bankAccountNumber: kycDetails.bankAccountNumber,
        }},
        hrDetails,
        createdAt: new Date(),
      });

      alert("✅ User added successfully!");
      setPersonalInfo({});
      setKycDetails({});
      setHrDetails({});
    } catch (err) {
      console.error("Error submitting:", err);
      alert("❌ Error submitting user!");
    }

    setLoading(false);
  };

  // ---------- Filter reporting managers ----------
  const filteredManagers = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchManager.toLowerCase())
  );

  // ---------- Render ----------
  return (
    <div className="add-user-container">
      <h1>Add Employee</h1>

      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === "personal" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("personal")}>Personal Info</button>
        <button className={activeTab === "kyc" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("kyc")}>KYC</button>
        <button className={activeTab === "hr" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("hr")}>HR Details</button>
      </div>

      {/* Personal Info */}
      {activeTab === "personal" && (
        <div className="form-grid">
          <label>Name:<input type="text" name="name" value={personalInfo.name} onChange={handlePersonalChange}/>{errors.name && <p className="error">{errors.name}</p>}</label>
          <label>Email:<input type="email" name="email" value={personalInfo.email} onChange={handlePersonalChange}/>{errors.email && <p className="error">{errors.email}</p>}</label>
          <label>Mobile:<input type="text" name="mobile" value={personalInfo.mobile} onChange={handlePersonalChange}/>{errors.mobile && <p className="error">{errors.mobile}</p>}</label>
          <label>Alt Mobile:<input type="text" name="altMobile" value={personalInfo.altMobile} onChange={handlePersonalChange}/></label>
          <label>Date of Birth:<input type="date" name="dob" value={personalInfo.dob} onChange={handlePersonalChange}/>{errors.dob && <p className="error">{errors.dob}</p>}</label>
          <label>Gender:
            <select name="gender" value={personalInfo.gender} onChange={handlePersonalChange}>
              <option value="">-- Select --</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Marital Status:
            <select name="maritalStatus" value={personalInfo.maritalStatus} onChange={handlePersonalChange}>
              <option value="">-- Select --</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
            </select>
          </label>
          {personalInfo.maritalStatus === "married" && (
            <>
              <label>Spouse Name:<input type="text" name="spouseName" value={personalInfo.spouseName} onChange={handlePersonalChange}/></label>
              <label>Children Count:<input type="number" name="childrenCount" value={personalInfo.childrenCount} onChange={handlePersonalChange}/></label>
            </>
          )}
          <label>Father:<input type="text" name="father" value={personalInfo.father} onChange={handlePersonalChange}/></label>
          <label>Mother:<input type="text" name="mother" value={personalInfo.mother} onChange={handlePersonalChange}/></label>
          <label>Company:
            <select name="company" value={personalInfo.company} onChange={handlePersonalChange}>
              <option value="">-- Select Company --</option>
              <option value="UjustBe">UjustBe</option>
              <option value="UjustCoonect">UjustCoonect</option>
              <option value="Karuyaki">Karuyaki</option>
            </select>
          </label>
          <label>Department:
            <input type="text" name="department" value={personalInfo.department} onChange={handlePersonalChange}/>
          </label>
          <label>Designation:<input type="text" name="designation" value={personalInfo.designation} onChange={handlePersonalChange}/></label>
          <label>Status:
            <select name="status" value={personalInfo.status} onChange={handlePersonalChange}>
              <option value="working">Working</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
            </select>
          </label>
          <label>Joining Date:<input type="date" name="joiningDate" value={personalInfo.joiningDate} onChange={handlePersonalChange}/></label>
          <label>Employee ID:<input type="text" name="employeeId" value={personalInfo.employeeId} onChange={handlePersonalChange}/></label>
          <label>Reporting Manager:
            <input type="text" placeholder="Search manager..." value={searchManager} onChange={(e) => setSearchManager(e.target.value)} />
            <select name="reportingManager" value={personalInfo.reportingManager} onChange={handlePersonalChange}>
              <option value="">-- Select Manager --</option>
              {filteredManagers.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
            </select>
          </label>
          <label>Emergency Contact Name:<input type="text" name="emergencyContactName" value={personalInfo.emergencyContactName} onChange={handlePersonalChange}/></label>
          <label>Emergency Contact Number:<input type="text" name="emergencyContactNumber" value={personalInfo.emergencyContactNumber} onChange={handlePersonalChange}/></label>
          <label>Blood Group:<input type="text" name="bloodGroup" value={personalInfo.bloodGroup} onChange={handlePersonalChange}/></label>
          <label>Address:<input type="text" name="address" value={personalInfo.address} onChange={handlePersonalChange}/></label>
          <label>Nationality:<input type="text" name="nationality" value={personalInfo.nationality} onChange={handlePersonalChange}/></label>
        </div>
      )}

      {/* KYC */}
      {activeTab === "kyc" && (
        <div className="form-grid">
          {[
            { label: "Aadhaar", file: "aadhaarFile", number: "aadhaarNumber" },
            { label: "PAN", file: "panFile", number: "panNumber" },
            { label: "Passport", file: "passportFile", number: "passportNumber" },
            { label: "Voter ID", file: "voterIdFile", number: "voterIdNumber" },
          ].map(item => (
            <div key={item.label}>
              <label>{item.label} File:<input type="file" name={item.file} onChange={handleKycChange} /></label>
              <label>{item.label} Number:<input type="text" name={item.number} value={kycDetails[item.number]} onChange={handleKycChange} /></label>
              {kycDetails[item.file] && (
                <p>Preview: {kycDetails[item.file].name}</p>
              )}
            </div>
          ))}
          <label>Profile Photo:<input type="file" name="profilePhoto" onChange={handleKycChange}/>{kycDetails.profilePhoto && <p>Preview: {kycDetails.profilePhoto.name}</p>}</label>
          <label>Experience Letters:<input type="file" name="experienceLetters" multiple onChange={handleKycChange}/>{kycDetails.experienceLetters.map(f => <p key={f.name}>{f.name}</p>)}</label>
          <label>Payslips:<input type="file" name="payslips" multiple onChange={handleKycChange}/>{kycDetails.payslips.map(f => <p key={f.name}>{f.name}</p>)}</label>
          <label>Certifications:<input type="file" name="certifications" multiple onChange={handleKycChange}/>{kycDetails.certifications.map(f => <p key={f.name}>{f.name}</p>)}</label>
          <label>Cancelled Cheque:<input type="file" name="cancelledCheque" onChange={handleKycChange}/>{kycDetails.cancelledCheque && <p>Preview: {kycDetails.cancelledCheque.name}</p>}</label>
          <label>Bank Account Number:<input type="text" name="bankAccountNumber" value={kycDetails.bankAccountNumber} onChange={handleKycChange}/></label>
          <label>Medical Certificate:<input type="file" name="medicalCertificate" onChange={handleKycChange}/>{kycDetails.medicalCertificate && <p>Preview: {kycDetails.medicalCertificate.name}</p>}</label>
          <label>Offer Letter:<input type="file" name="offerLetter" onChange={handleKycChange}/>{kycDetails.offerLetter && <p>Preview: {kycDetails.offerLetter.name}</p>}</label>
          <label>Relieving / NOC Letters:<input type="file" name="relievingLetters" multiple onChange={handleKycChange}/>{kycDetails.relievingLetters.map(f => <p key={f.name}>{f.name}</p>)}</label>
        </div>
      )}

      {/* HR Details */}
      {activeTab === "hr" && (
        <div className="form-grid">
          <label>Probation Period:<input type="text" name="probationPeriod" value={hrDetails.probationPeriod} onChange={handleHrChange}/></label>
          <label>Confirmation Date:<input type="date" name="confirmationDate" value={hrDetails.confirmationDate} onChange={handleHrChange}/></label>
          <label>Device / Laptop Assigned:<input type="text" name="deviceAssigned" value={hrDetails.deviceAssigned} onChange={handleHrChange}/></label>
          <label>Skills / Specialization:<input type="text" name="skills" value={hrDetails.skills} onChange={handleHrChange}/></label>
          <label>Languages Known:<input type="text" name="languagesKnown" value={hrDetails.languagesKnown} onChange={handleHrChange}/></label>
          <label>Remarks / Notes:<textarea name="remarks" value={hrDetails.remarks} onChange={handleHrChange}/></label>
        </div>
      )}

      <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
