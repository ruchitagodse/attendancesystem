import React, { useEffect, useState } from "react";
import { db, storage } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,addDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import QRCode from "qrcode";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";
import logo from "../../public/videoframe_logo.png";
import "../../src/app/styles/addUser.scss";
import "../../src/app/styles/main.scss";
const AddAsset = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "",
    status: "Available",
    description: "",
    imageURL: "",
    qrCodeURL: "",
  });
  const [editAssetId, setEditAssetId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [employees, setEmployees] = useState([]);

  // ------------------ Fetch data ------------------

 useEffect(() => {
  fetchAssets();
  fetchCategories();
  fetchEmployees(); // New function to get all employees
}, []);

const fetchEmployees = async () => {
  const snapshot = await getDocs(collection(db, "employeeDetails"));
  setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};


  const fetchCategories = async () => {
    const snapshot = await getDocs(collection(db, "categories"));
    setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchAssets = async () => {
    const snapshot = await getDocs(collection(db, "assets"));
    setAssets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  // ------------------ Asset ID ------------------
  const generateAssetId = async (categoryId) => {
    const catRef = doc(db, "categories", categoryId);
    const catSnap = await getDoc(catRef);
    if (!catSnap.exists()) throw new Error("Category not found");

    const data = catSnap.data();
    const currentCounter = Number(data.idCounter) || 0;
    const newCounter = currentCounter + 1;
    const newId = `${data.prefix}-${newCounter.toString().padStart(3, "0")}`;
    await updateDoc(catRef, { idCounter: newCounter });
    return newId;
  };

  // ------------------ Upload Image ------------------
  const uploadImage = async (file, assetId) => {
    if (!file) return "";
    const imageRef = ref(storage, `assets/${assetId}/${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  // ------------------ Generate QR ------------------
  const generateQRCode = async (assetId) => {
    const qrData = `${window.location.origin}/asset/${assetId}`;
    return await QRCode.toDataURL(qrData);
  };


  // ------------------ Add / Update ------------------
  const handleAddOrUpdateAsset = async () => {
    if (!newAsset.name || !newAsset.category) {
      return alert("Please fill required fields!");
    }

    let assetId = editAssetId || (await generateAssetId(newAsset.category));

    // Upload image
    const imageURL = await uploadImage(imageFile, assetId);

    // Generate QR code
    const qrCodeURL = await generateQRCode(assetId);

    const assetData = {
      ...newAsset,
      imageURL: imageURL || newAsset.imageURL,
      qrCodeURL,
      createdAt: new Date(),
    };

    if (editAssetId) {
      await updateDoc(doc(db, "assets", editAssetId), assetData);
      await logAssetAction(editAssetId, "Updated");
      alert("✅ Asset updated!");
    } else {
      await setDoc(doc(db, "assets", assetId), assetData);
      await logAssetAction(assetId, "Created");
      alert("✅ Asset added!");
    }

    setNewAsset({
      name: "",
      category: "",
      status: "Available",
      description: "",
      imageURL: "",
      qrCodeURL: "",
    });
    setImageFile(null);
    setEditAssetId(null);
    fetchAssets();
  };
const logAssetAction = async (assetId, action, employee = null) => {
  const assetRef = doc(db, "assets", assetId);

  const logEntry = {
    action,
    employee: employee ? employee.personalInfo?.name : null,
    timestamp: new Date(),
    performedBy: "Admin",
  };

  // Add log entry to asset's "logs" array
  await updateDoc(assetRef, {
    logs: [...(assets.find(a => a.id === assetId)?.logs || []), logEntry]
  });
};

  // ------------------ Delete ------------------
  const handleDeleteAsset = async (id) => {
    await deleteDoc(doc(db, "assets", id));
    await logAssetAction(id, "Deleted");
    alert("🗑️ Asset deleted!");
    fetchAssets();
  };

  // ------------------ Edit ------------------
  const handleEditAsset = (asset) => {
    setNewAsset(asset);
    setEditAssetId(asset.id);
  };

  // ------------------ Employee Search ------------------
  const handleSearch = async () => {
    if (!searchName.trim()) return alert("Enter name to search");

    const snapshot = await getDocs(collection(db, "employeeDetails"));
    const filtered = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((emp) =>
        emp.personalInfo?.name
          ?.toLowerCase()
          .includes(searchName.toLowerCase())
      );

    setEmployees(filtered);
  };

  // ------------------ Assign Asset ------------------
  const handleAssignAsset = async (assetId, employee) => {
    await updateDoc(doc(db, "assets", assetId), {
      status: "Assigned",
      assignedTo: {
        name: employee.personalInfo?.name,
        email: employee.personalInfo?.email,
        phone: employee.personalInfo?.mobile,
      },
      assignedDate: new Date(),
    });
    await logAssetAction(assetId, "Assigned", employee);
    alert(`📦 Assigned to ${employee.personalInfo?.name}`);
    fetchAssets();
  };

  return (
    <>
      <Header />
      <div className="logoContainer">
        <img src={logo} alt="Logo" className="logos" />
      </div>
      <Navbar />
      <main className="maincontainer">
        <div className="users-table-container">
          {/* Add / Edit Form */}
          <div className="form-container">
            <h2>{editAssetId ? "Edit Asset" : "Add Asset"}</h2>
            <input
              type="text"
              placeholder="Asset Name"
              value={newAsset.name}
              onChange={(e) =>
                setNewAsset({ ...newAsset, name: e.target.value })
              }
            />
            <select
              value={newAsset.category}
              onChange={(e) =>
                setNewAsset({ ...newAsset, category: e.target.value })
              }
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={newAsset.status}
              onChange={(e) =>
                setNewAsset({ ...newAsset, status: e.target.value })
              }
            >
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            <textarea
              placeholder="Description"
              value={newAsset.description}
              onChange={(e) =>
                setNewAsset({ ...newAsset, description: e.target.value })
              }
            />
            <input type="file" onChange={(e) => setImageFile(e.target.files[0])} />
            <button className="add-btn" onClick={handleAddOrUpdateAsset}>
              {editAssetId ? "Update Asset" : "Add Asset"}
            </button>
          </div>

          {/* Asset Table */}
         {/* Asset Table */}
<div className="table-container">
  <h2>All Assets</h2>
  <input
    type="text"
    placeholder="Search employee by name"
    value={searchName}
    onChange={(e) => setSearchName(e.target.value)}
  />
  <button onClick={handleSearch}>Search</button>

  <table className="users-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Category</th>
        <th>Status</th>
        <th>Assigned To</th>
        <th>QR</th>
        <th>Actions</th>
        <th>Assign</th>
      </tr>
    </thead>
    <tbody>
      {assets.map((asset) => (
        <tr key={asset.id}>
          <td>{asset.id}</td>
          <td>{asset.name}</td>
          <td>{categories.find((c) => c.id === asset.category)?.name || "-"}</td>
          <td>{asset.status}</td>
          <td>{asset.assignedTo?.name || "-"}</td>
          <td>
            {asset.qrCodeURL && (
              <img src={asset.qrCodeURL} alt="QR" style={{ width: "60px" }} />
            )}
          </td>
          <td>
            <button className="edit-btn" onClick={() => handleEditAsset(asset)}>
              Edit
            </button>
            <button className="delete-btn" onClick={() => handleDeleteAsset(asset.id)}>
              Delete
            </button>
          </td>
         <td>
  {asset.status === "Available" ? (
    <select
      onChange={(e) => {
        const empId = e.target.value;
        if (empId) {
          const selectedEmployee = employees.find(emp => emp.id === empId);
          handleAssignAsset(asset.id, selectedEmployee);
        }
      }}
    >
      <option value="">Assign to...</option>
      {employees.map((emp) => (
        <option key={emp.id} value={emp.id}>
          {emp.personalInfo?.name}
        </option>
      ))}
    </select>
  ) : (
    "-"
  )}
</td>

        </tr>
      ))}
    </tbody>
  </table>
</div>


          {/* Employee Assign */}
   
        </div>
      </main>
    </>
  );
};

export default AddAsset;
