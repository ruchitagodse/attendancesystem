import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';  
import { collection, getDocs, orderBy, query } from 'firebase/firestore'; 
import UserHeader from './UserHeader';

const PolicyPage = () => {
    const [policies, setPolicies] = useState([]);

    useEffect(() => {
        const fetchPolicies = async () => {
            const policiesCollection = collection(db, 'policies');
            const q = query(policiesCollection, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            setPolicies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchPolicies();
    }, []);

    const isNewPolicy = (createdAt) => {
        const currentDate = new Date();
        const creationDate = createdAt.toDate();
        const diffInDays = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24));
        return diffInDays <= 15; // Highlight policies created within 15 days
    };


    return (
        <>
        <UserHeader/>   
          <div className="sessions-panel-wrapper">
            <div className="user-session">
            <h2>Organizational Policy</h2>
            <button className="m-button-5" onClick={() => window.history.back()}>
    Back
  </button>
              <div className="session-table-container">
            <table className="sessions-table">
                <thead>
                    <tr>
                        <th>Sr No</th>
                        <th>Policy </th>
                        <th>View</th>
                    </tr>
                </thead>
                <tbody>
                    {policies.map((policy, index) => (
                        <tr key={policy.id}>
                            <td>{index + 1}</td>
                            <td
    style={{
      fontWeight: isNewPolicy(policy.createdAt) ? "bold" : "normal",
      color: isNewPolicy(policy.createdAt) ? "#007bff" : "inherit",
    }}
  >{policy.name} {isNewPolicy(policy.createdAt) && (
                                            <span
                                            className="new-badge"
                                            style={{
                                              display: "inline-block",
                                              background: "#ff5722",
                                              color: "white",
                                              fontSize: "0.8rem",
                                              padding: "2px 8px",
                                              marginLeft: "10px",
                                              borderRadius: "12px",
                                            }}
                                          >
                                            Newly Added
                                          </span>
                                          
                                        )}</td>
                            <td>
                                <a className="m-button-8" href={policy.url} target="_blank" rel="noopener noreferrer">
                                    View
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        </div>
        </div>
        
        </>
    );
};

export default PolicyPage;
