import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";

const AssetCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", prefix: "" });
  const [editId, setEditId] = useState(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const snapshot = await getDocs(collection(db, "categories"));
    setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  // Add or update category
  const handleAddOrUpdateCategory = async () => {
    if (!newCategory.name || !newCategory.prefix) {
      alert("Please fill all fields");
      return;
    }

    if (editId) {
      // Update existing
      const catRef = doc(db, "categories", editId);
      await updateDoc(catRef, { ...newCategory });
      alert("✅ Category updated");
    } else {
      // Add new
      await addDoc(collection(db, "categories"), { ...newCategory, lastNumber: 0 });
      alert("✅ Category added");
    }

    setNewCategory({ name: "", prefix: "" });
    setEditId(null);
    fetchCategories();
  };

  // Edit category
  const handleEdit = (category) => {
    setNewCategory({ name: category.name, prefix: category.prefix });
    setEditId(category.id);
  };

  // Delete category
  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await deleteDoc(doc(db, "categories", id));
      alert("🗑️ Category deleted");
      fetchCategories();
    }
  };

  return (
    <>
      <Header />
      <Navbar />
      <main className="maincontainer">
        <div className="users-table-container">
          <div>
            <h2>{editId ? "Edit Category" : "Add Category"}</h2>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="ID Prefix (e.g., LAP, MOB)"
              value={newCategory.prefix}
              onChange={(e) =>
                setNewCategory({ ...newCategory, prefix: e.target.value.toUpperCase() })
              }
            />
            <button onClick={handleAddOrUpdateCategory}>
              {editId ? "Update Category" : "Add Category"}
            </button>
          </div>

          <div>
            <h2>All Categories</h2>
            {categories.length === 0 ? (
              <p>No categories added yet.</p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Prefix</th>
                    <th>Last Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td>{cat.prefix}</td>
                      <td>{cat.lastNumber}</td>
                      <td>
                        <button onClick={() => handleEdit(cat)}>Edit</button>
                        <button onClick={() => handleDelete(cat.id)}>Delete</button>
                      </td>
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

export default AssetCategories;
