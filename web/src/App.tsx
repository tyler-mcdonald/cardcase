import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { AccountsPage } from "./routes/AccountsPage";
import { DemoPage } from "./routes/DemoPage";
import { LoginPage } from "./routes/LoginPage";
import { NotFoundPage } from "./routes/NotFoundPage";
import { TransactionsPage } from "./routes/TransactionsPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AccountsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
