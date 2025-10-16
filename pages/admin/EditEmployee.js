"use client";
export const dynamic = "force-dynamic";

import React from "react";
import Layout from "../../component/Layout";
import "../../src/app/styles/main.scss";
import EditEmployee from "../../component/EditEmployee"; // ✅ renamed import

const EditEmployeePage = () => {
  return (
    <Layout>
      <EditEmployee /> {/* ✅ now it renders the imported component */}
    </Layout>
  );
};

export default EditEmployeePage;
