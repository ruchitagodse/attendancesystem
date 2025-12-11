'use client';
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
    childrenCount: 0,
    father: "",
    mother: "",
    company: "",
    department: "",
    designation: "",
    status: "active",
    joiningDate: "",
    employeeId: "",
    reportingManager: "",
    emergencyContactName1: "",
    emergencyContactNumber1: "",
    emergencyRelation1: "",
    emergencyContactName2: "",
    emergencyContactNumber2: "",
    emergencyRelation2: "",
    bloodGroup: "",
    address: "",
    nationality: "",
    workType: "",
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
    ifscCode: "",
    salaryRevisions: [],
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
    band: "",
    grade: "",
    level: "",
    resignationDate: "",
    lastWorkingDay: "",
  });

  // ---------- Fetch employees for reporting manager ----------
  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employeeDetails"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().personalInfo?.name,
      }));
      setEmployees(data);
    };
    fetchEmployees();
  }, []);

  // ---------- Auto Confirmation Date (6 months after DOJ) ----------
  useEffect(() => {
    if (personalInfo.joiningDate) {
      const doj = new Date(personalInfo.joiningDate);
      doj.setMonth(doj.getMonth() + 6);
      setHrDetails(prev => ({
        ...prev,
        confirmationDate: doj.toISOString().split("T")[0],
      }));
    }
  }, [personalInfo.joiningDate]);

  // ---------- Handle Changes ----------
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: name === "childrenCount" ? Math.max(0, Number(value)) : value,
    }));
  };

  const handleKycChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (["experienceLetters", "payslips", "certifications", "relievingLetters", "salaryRevisions"].includes(name)) {
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

  // ---------- Upload File ----------
  const uploadFile = async (file, folderName) => {
    if (!file) return null;
    const storageRef = ref(storage, `${folderName}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // ---------- Generate Employee ID ----------
  const generateEmployeeId = async (companyCode) => {
    const snapshot = await getDocs(collection(db, "employeeDetails"));
    const total = snapshot.size + 1;
    return `${companyCode}${String(total).padStart(7, "0")}`;
  };

  // ---------- Validation ----------
  const validateForm = () => {
    let newErrors = {};
    if (!personalInfo.name.trim()) newErrors.name = "Name is required";
 
    if (!personalInfo.mobile.match(/^[0-9]{10}$/))
      newErrors.mobile = "Valid 10-digit mobile required";
  
    if (!personalInfo.dob) newErrors.dob = "Date of Birth required";
    else if (new Date(personalInfo.dob) > new Date())
      newErrors.dob = "Date of Birth cannot be in the future";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!validateForm()) return alert("Please fix the highlighted errors before submitting");
    setLoading(true);

    try {
      const employeeId = await generateEmployeeId("KSPL");

      const uploadedFiles = {
        aadhaarFile: await uploadFile(kycDetails.aadhaarFile, "aadhaar"),
        panFile: await uploadFile(kycDetails.panFile, "pan"),
        passportFile: await uploadFile(kycDetails.passportFile, "passport"),
        voterIdFile: await uploadFile(kycDetails.voterIdFile, "voterId"),
        profilePhoto: await uploadFile(kycDetails.profilePhoto, "profilePhotos"),
        experienceLetters: await Promise.all(kycDetails.experienceLetters.map(file => uploadFile(file, "experienceLetters"))),
        payslips: await Promise.all(kycDetails.payslips.map(file => uploadFile(file, "payslips"))),
        certifications: await Promise.all(kycDetails.certifications.map(file => uploadFile(file, "certifications"))),
        cancelledCheque: await uploadFile(kycDetails.cancelledCheque, "cancelledCheques"),
        salaryRevisions: await Promise.all(kycDetails.salaryRevisions.map(file => uploadFile(file, "salaryRevisions"))),
        medicalCertificate: await uploadFile(kycDetails.medicalCertificate, "medicalCertificates"),
        offerLetter: await uploadFile(kycDetails.offerLetter, "offerLetters"),
        relievingLetters: await Promise.all(kycDetails.relievingLetters.map(file => uploadFile(file, "relievingLetters"))),
      };

      await setDoc(doc(db, "employeeDetails", personalInfo.mobile), {
        personalInfo: { ...personalInfo, employeeId },
        kycDetails: {
          ...uploadedFiles,
          aadhaarNumber: kycDetails.aadhaarNumber,
          panNumber: kycDetails.panNumber,
          passportNumber: kycDetails.passportNumber,
          voterIdNumber: kycDetails.voterIdNumber,
          bankAccountNumber: kycDetails.bankAccountNumber,
          ifscCode: kycDetails.ifscCode,
        },
        hrDetails,
        createdAt: new Date(),
      });

      alert("✅ Employee added successfully!");
    } catch (err) {
      console.error("Error submitting:", err);
      alert("❌ Error submitting employee details!");
    }
    setLoading(false);
  };

  const filteredManagers = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchManager.toLowerCase())
  );

  // ---------- Render ----------
  return (
    <div className="add-user-container">
      <h1>Add Employee</h1>

      <div className="tabs">
        <button className={activeTab === "personal" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("personal")}>Personal Info</button>
        <button className={activeTab === "kyc" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("kyc")}>KYC</button>
        <button className={activeTab === "hr" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("hr")}>HR Details</button>
      </div>

      {/* ---------- PERSONAL INFO ---------- */}
      {activeTab === "personal" && (
        <div className="form-grid">
          <label>Name*:<input type="text" name="name" value={personalInfo.name} onChange={handlePersonalChange}/>{errors.name && <p className="error">{errors.name}</p>}</label>
          <label>Email*:<input type="email" name="email" value={personalInfo.email} onChange={handlePersonalChange}/>{errors.email && <p className="error">{errors.email}</p>}</label>
          <label>Mobile*:<input type="text" name="mobile" value={personalInfo.mobile} onChange={handlePersonalChange}/>{errors.mobile && <p className="error">{errors.mobile}</p>}</label>
          <label>Alt Mobile:<input type="text" name="altMobile" value={personalInfo.altMobile} onChange={handlePersonalChange}/></label>
          <label>Date of Birth*:<input type="date" name="dob" max={new Date().toISOString().split("T")[0]} value={personalInfo.dob} onChange={handlePersonalChange}/>{errors.dob && <p className="error">{errors.dob}</p>}</label>
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
              <label>Children Count:<input type="number" name="childrenCount" min="0" value={personalInfo.childrenCount} onChange={handlePersonalChange}/></label>
            </>
          )}
          <label>Father Name:<input type="text" name="father" value={personalInfo.father} onChange={handlePersonalChange}/></label>
          <label>Mother Name:<input type="text" name="mother" value={personalInfo.mother} onChange={handlePersonalChange}/></label>
          <label>Company*:
            <select name="company" value={personalInfo.company} onChange={handlePersonalChange}>
              <option value="">-- Select Company --</option>
              <option value="UjustBe">UjustBe</option>
              <option value="UjustConnect">UjustConnect</option>
              <option value="Karuyaki">Karuyaki</option>
            </select>
            {errors.company && <p className="error">{errors.company}</p>}
          </label>
          <label>Department*:
            <select name="department" value={personalInfo.department} onChange={handlePersonalChange}>
              <option value="">-- Select Department --</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
            </select>
            {errors.department && <p className="error">{errors.department}</p>}
          </label>
          <label>Designation*:<input type="text" name="designation" value={personalInfo.designation} onChange={handlePersonalChange}/>{errors.designation && <p className="error">{errors.designation}</p>}</label>
          <label>Status:
            <select name="status" value={personalInfo.status} onChange={handlePersonalChange}>
              <option value="active">Active</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
            </select>
          </label>
          <label>Work Type*:
            <select name="workType" value={personalInfo.workType} onChange={handlePersonalChange}>
              <option value="">-- Select --</option>
              <option value="Permanent">Permanent</option>
              <option value="Contractor">Contractor</option>
              <option value="Intern">Intern</option>
            </select>
            {errors.workType && <p className="error">{errors.workType}</p>}
          </label>
          <label>Joining Date:<input type="date" name="joiningDate" value={personalInfo.joiningDate} onChange={handlePersonalChange}/></label>
          <label>Employee ID:<input type="text" name="employeeId" value={personalInfo.employeeId} readOnly /></label>
          <label>Reporting Manager:
            <input type="text" placeholder="Search manager..." value={searchManager} onChange={(e) => setSearchManager(e.target.value)} />
            <select name="reportingManager" value={personalInfo.reportingManager} onChange={handlePersonalChange}>
              <option value="">-- Select Manager --</option>
              {filteredManagers.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
            </select>
          </label>
          <h4>Emergency Contacts (2 Persons)</h4>
          <label>Name 1*:<input type="text" name="emergencyContactName1" value={personalInfo.emergencyContactName1} onChange={handlePersonalChange}/></label>
          <label>Relation:<input type="text" name="emergencyRelation1" value={personalInfo.emergencyRelation1} onChange={handlePersonalChange}/></label>
          <label>Contact Number*:<input type="text" name="emergencyContactNumber1" value={personalInfo.emergencyContactNumber1} onChange={handlePersonalChange}/></label>
          <label>Name 2:<input type="text" name="emergencyContactName2" value={personalInfo.emergencyContactName2} onChange={handlePersonalChange}/></label>
          <label>Relation:<input type="text" name="emergencyRelation2" value={personalInfo.emergencyRelation2} onChange={handlePersonalChange}/></label>
          <label>Contact Number:<input type="text" name="emergencyContactNumber2" value={personalInfo.emergencyContactNumber2} onChange={handlePersonalChange}/></label>
          <label>Blood Group:<input type="text" name="bloodGroup" value={personalInfo.bloodGroup} onChange={handlePersonalChange}/></label>
          <label>Address:<input type="text" name="address" value={personalInfo.address} onChange={handlePersonalChange}/></label>
          <label>Nationality:<input type="text" name="nationality" value={personalInfo.nationality} onChange={handlePersonalChange}/></label>
        </div>
      )}

      {/* ---------- KYC ---------- */}
      {activeTab === "kyc" && (
        <div className="form-grid">
          {["aadhaar", "pan", "passport", "voterId"].map(item => (
            <div key={item}>
              <label>{item.toUpperCase()} File:<input type="file" name={`${item}File`} onChange={handleKycChange}/></label>
              <label>{item.toUpperCase()} Number:<input type="text" name={`${item}Number`} value={kycDetails[`${item}Number`]} onChange={handleKycChange}/></label>
            </div>
          ))}
          <label>Profile Photo:<input type="file" name="profilePhoto" onChange={handleKycChange}/></label>
          <label>Experience Letters:<input type="file" name="experienceLetters" multiple onChange={handleKycChange}/></label>
          <label>Payslips:<input type="file" name="payslips" multiple onChange={handleKycChange}/></label>
          <label>Certifications:<input type="file" name="certifications" multiple onChange={handleKycChange}/></label>
          <label>Cancelled Cheque:<input type="file" name="cancelledCheque" onChange={handleKycChange}/></label>
          <label>Bank Account Number:<input type="text" name="bankAccountNumber" value={kycDetails.bankAccountNumber} onChange={handleKycChange}/></label>
          <label>IFSC Code:<input type="text" name="ifscCode" value={kycDetails.ifscCode} onChange={handleKycChange}/></label>
          <label>Salary Revision Letters:<input type="file" name="salaryRevisions" multiple onChange={handleKycChange}/></label>
          <label>Medical Certificate:<input type="file" name="medicalCertificate" onChange={handleKycChange}/></label>
          <label>Offer Letter:<input type="file" name="offerLetter" onChange={handleKycChange}/></label>
          <label>Relieving / NOC Letters:<input type="file" name="relievingLetters" multiple onChange={handleKycChange}/></label>
        </div>
      )}

      {/* ---------- HR DETAILS ---------- */}
      {activeTab === "hr" && (
        <div className="form-grid">
          <label>Probation Period:<input type="text" name="probationPeriod" value={hrDetails.probationPeriod} onChange={handleHrChange}/></label>
          <label>Confirmation Date:<input type="date" name="confirmationDate" value={hrDetails.confirmationDate} readOnly/></label>
          <label>Device Assigned:<input type="text" name="deviceAssigned" value={hrDetails.deviceAssigned} onChange={handleHrChange}/></label>
          <label>Skills:<input type="text" name="skills" value={hrDetails.skills} onChange={handleHrChange}/></label>
          <label>Languages Known:<input type="text" name="languagesKnown" value={hrDetails.languagesKnown} onChange={handleHrChange}/></label>
          <label>Remarks:<textarea name="remarks" value={hrDetails.remarks} onChange={handleHrChange}></textarea></label>
          <label>Band:<input type="text" name="band" value={hrDetails.band} onChange={handleHrChange}/></label>
          <label>Grade:<input type="text" name="grade" value={hrDetails.grade} onChange={handleHrChange}/></label>
          <label>Level:<input type="text" name="level" value={hrDetails.level} onChange={handleHrChange}/></label>
          <label>Resignation Date:<input type="date" name="resignationDate" value={hrDetails.resignationDate} onChange={handleHrChange}/></label>
          <label>Last Working Day:<input type="date" name="lastWorkingDay" value={hrDetails.lastWorkingDay} onChange={handleHrChange}/></label>
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading} className="submit-btn">
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
