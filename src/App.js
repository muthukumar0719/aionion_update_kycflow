import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./Style.css";

//COMPONENTS
import AccessibilityManager from "./Components/AccessibilityManager";
import ScrollToTop from "./Components/ScrollToTop";

//Admin
import AdminDashboard from "./Pages/admin/Dashboard";
import AdminApplicationsList from "./Pages/admin/ApplicationsList";
import AdminApplicationDetail from "./Pages/admin/ApplicationDetail";
import AdminLogin from "./Pages/admin/AdminLogin";
import AdminUserList from "./Pages/admin/UserList";
import RMDashboard from "./Pages/admin/RMDashboard";
import RequireAdminAuth from "./Components/admin/RequireAdminAuth";
import MakerCheckerWorkflow from "./Pages/admin/MakerCheckerWorkflow";

import Accountcloserform from "./Pages/Accountcloserform";
import Rekycform from "./Pages/Rekycform";

//KYC-FLOW
import Numberregistration from "./Pages/kyc/contact-details/Numberregistration";
import Numberotp from "./Pages/kyc/contact-details/Numberotp";

import Emailregistration from "./Pages/kyc/contact-details/Emailregistration";
import Emailotp from "./Pages/kyc/contact-details/Emailotp";

import Pancardverification from "./Pages/kyc/demat-details/Pancardverification";
import IncomeTaxDetails from "./Pages/kyc/IncomeTaxDetails";
import DigilockerDetails from "./Pages/kyc/DigilockerDetails";
import DigilockerSuccess from "./Pages/kyc/DigilockerSuccess";

// import Bankdetails from "./Pages/kyc/bank-details/Bankdetails";
// import ReversePennyDrop from "./Pages/kyc/bank-details/ReversePennyDrop";
import Bankproof from "./Pages/kyc/bank-details/Bankproof";

import Personaldetails from "./Pages/kyc/personal-details/Personaldetails";
import KraDetails from "./Pages/kyc/KraDetails";

import Nomination from "./Pages/kyc/personal-details/Nomination";
import Percentageallocation from "./Pages/kyc/personal-details/Percentageallocation";
import Nonomination from "./Pages/kyc/personal-details/Nonomination";

import Scheme from "./Pages/kyc/scheme-details/Scheme";
import PaymentSummary from "./Pages/kyc/payment-details/PaymentSummary";
import PaymentCompleted from "./Pages/kyc/payment-details/PaymentCompleted";
import PaymentFailed from "./Pages/kyc/payment-details/PaymentFailed";
import SignatureUpload from "./Pages/kyc/kyc-verification/SignatureUpload";

import PhotoVerification from "./Pages/kyc/kyc-verification/PhotoVerification";

import KycCompleted from "./Pages/kyc/KycCompleted";
import SignatureVerification from "./Pages/kyc/kyc-verification/SignatureVerification";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import Chatbot from "./Components/chatbot/Chatbot";

const Layout = () => {
  const location = useLocation();

  //changes=====
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith("/admin");

    document.body.classList.toggle("admin-route", isAdminRoute);

    return () => {
      document.body.classList.remove("admin-route");
    };
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path='/' element={<Navigate to='/numberregistration' replace />} />
        <Route path='/accountcloser' element={<Accountcloserform />} />
        <Route path='/rekycpage' element={<Rekycform />} />
        <Route path='/numberregistration' element={<Numberregistration />} />
        <Route path='/numberotp' element={<Numberotp />} />
        <Route path='/emailverify' element={<Emailregistration />} />
        <Route path='/emailotp' element={<Emailotp />} />
        <Route path='/panverify' element={<Pancardverification />} />
        <Route path='/kra-details' element={<KraDetails />} />
        <Route path='/income-details' element={<IncomeTaxDetails />} />
        <Route path='/digilocker-success' element={<DigilockerSuccess />} />
        <Route path='/digilocker-details' element={<DigilockerDetails />} />
        {/* <Route path='/bankdetails' element={<Bankdetails />} />
        <Route path='/reverse-penny-drop' element={<ReversePennyDrop />} /> */}
        <Route path='/bankproof' element={<Bankproof />} />
        <Route path='/personaldetails' element={<Personaldetails />} />
        <Route path='/nomination' element={<Nomination />} />
        <Route
          path='/Percentage-allocation'
          element={<Percentageallocation />}
        />
        <Route path='/no-nomination' element={<Nonomination />} />
        <Route path='/schemedetail' element={<Scheme />} />
        <Route path='/payment-details' element={<PaymentSummary />} />
        <Route path='/payment-completed' element={<PaymentCompleted />} />
        <Route path='/payment-failed' element={<PaymentFailed />} />
        <Route path='/photoverify' element={<PhotoVerification />} />
        
        <Route path='/uploadsignature' element={<SignatureUpload />} />
        <Route path='/esign' element={<SignatureVerification />} />
        <Route path='/kyc-complete' element={<KycCompleted />} />
        <Route path='/admin/login' element={<AdminLogin />} />
        <Route
          path='/admin/dashboard'
          element={
            <RequireAdminAuth>
              <AdminDashboard />
            </RequireAdminAuth>
          }
        />
        <Route
          path='/admin/applications'
          element={
            <RequireAdminAuth>
              <AdminApplicationsList />
            </RequireAdminAuth>
          }
        />
        <Route
          path='/admin/rm-dashboard'
          element={
            <RequireAdminAuth>
              <RMDashboard />
            </RequireAdminAuth>
          }
        />
        <Route
          path='/admin/users'
          element={
            <RequireAdminAuth>
              <AdminUserList />
            </RequireAdminAuth>
          }
        />
        <Route
          path='/admin/applications/:id'
          element={
            <RequireAdminAuth>
              <AdminApplicationDetail />
            </RequireAdminAuth>
          }
        />
        <Route
          path='/admin/workflow'
          element={
            <RequireAdminAuth>
              <MakerCheckerWorkflow />
            </RequireAdminAuth>
          }
        />
      </Routes>
      {/* <Chatbot /> */}
      <AccessibilityManager />
      <ToastContainer position='top-right' autoClose={2500} />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout />
    </BrowserRouter>
  );
}

export default App;
