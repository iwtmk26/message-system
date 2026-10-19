import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import "./App.css";
import RegistrationPage from "./pages/RegistrationPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import CompletionPage from "./pages/CompletionPage.tsx";
import ListPage from "./pages/ListPage";
import DetailPage from "./pages/DetailPage";
import NuisanceListPage from "./pages/NuisanceListPage";
import EnvBanner from "./components/EnvBanner";
import NavTabs from "./components/NavTabs";


function App() {
  return (
    <BrowserRouter>

      <EnvBanner />

      <NavTabs />

      <Routes>

        {/* 業務は、まず番号の確認から始まるので、最初の画面は「迷惑電話チェック」 */}
        <Route
          path="/"
          element={<Navigate to="/register" replace />}
        />

        <Route
          path="/register"
          element={<RegistrationPage />}
        />

        <Route
          path="/confirm"
          element={<ConfirmationPage />}
        />

        <Route
          path="/complete"
          element={<CompletionPage />}
        />

        <Route
          path="/list"
          element={<ListPage />}
        />

        <Route
          path="/detail/:messageId"
          element={<DetailPage />}
        />

        {/* 旧「迷惑電話チェック」の画面は、登録フォームの電話番号の欄に統合した */}
        <Route
          path="/nuisance"
          element={<Navigate to="/register" replace />}
        />

        <Route
          path="/nuisance/list"
          element={<NuisanceListPage />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;