import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import EditEmployee from "./EditEmployee";
import "../../src/app/styles/addUser.scss";
import "../../src/app/styles/main.scss";
export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employeeDetails"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(data);
    };
    fetchEmployees();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      await deleteDoc(doc(db, "employeeDetails", id));
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.personalInfo.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="manage-employees">
      <h1>Manage Employees</h1>
      <input 
        type="text" 
        placeholder="Search by name..." 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
      />

  <table className="leave-requests-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.personalInfo.name}</td>
              <td>{emp.personalInfo.mobile}</td>
              <td>{emp.personalInfo.department}</td>
              <td>{emp.personalInfo.designation}</td>
              <td>{emp.personalInfo.status}</td>
              <td>
                <button onClick={() => setSelectedEmployee(emp)}>Edit</button>
                <button onClick={() => handleDelete(emp.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedEmployee && 
        <EditEmployee 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
          onUpdate={(updated) => {
            setEmployees(employees.map(emp => emp.id === updated.id ? updated : emp));
            setSelectedEmployee(null);
          }}
        />
      }
    </div>
  );
}
