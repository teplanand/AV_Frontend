import { Route, Routes } from "react-router";
import { Page } from "../../components/common/Page";
import AppLayout from "../../layout/AppLayout";
import AdvancePaymentDashboard from "../../pages/Dashboard";
import SupplierPaymentPage from "../../pages/Dashboard/SupplierPaymentPage";
import BudgetaryPaymentPage from "../../pages/Dashboard/BudgetaryPaymentPage";
import CompanyList from "../../pages/master/company";
import SupplierPage from "../../pages/Supplier";
import POPage from "../../pages/PO";
import WorkflowPage from "../../pages/Workflow";

export default function AdvancePaymentRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <Page module="company">
              <AdvancePaymentDashboard />
            </Page>
          }
        />
        <Route
          path="/supplier-payment"
          element={
            <Page module="company">
              <SupplierPaymentPage />
            </Page>
          }
        />
        <Route
          path="/payment-voucher"
          element={
            <Page module="company">
              <BudgetaryPaymentPage />
            </Page>
          }
        />
        <Route
          path="/Company"
          element={
            <Page module="company">
              <CompanyList />
            </Page>
          }
        />
        <Route
          path="/supplier"
          element={
            <Page module="company">
              <SupplierPage />
            </Page>
          }
        />
        <Route
          path="/po"
          element={
            <Page module="company">
              <POPage />
            </Page>
          }
        />
        <Route
          path="/workflow"
          element={
            <Page module="company">
              <WorkflowPage />
            </Page>
          }
        />
      </Route>
    </Routes>
  );
}
