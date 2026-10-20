import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import "./App.css";
import RegistrationPage from "./pages/RegistrationPage";
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

        {/* 最初の画面は、登録フォーム（電話番号を入れると、迷惑番号か自動で確認する） */}
        <Route
          path="/"
          element={<Navigate to="/register" replace />}
        />

        <Route
          path="/register"
          element={<RegistrationPage />}
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