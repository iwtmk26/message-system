import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import RegistrationPage from "./pages/RegistrationPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import CompletionPage from "./pages/CompletionPage.tsx";
import ListPage from "./pages/ListPage";
import DetailPage from "./pages/DetailPage";
import NuisanceSearchPage from "./pages/NuisanceSearchPage";
import NuisanceListPage from "./pages/NuisanceListPage";
import EnvBanner from "./components/EnvBanner";
import NavTabs from "./components/NavTabs";


function App() {
  return (
    <BrowserRouter>

      <EnvBanner />

      <NavTabs />

      <Routes>

        <Route
          path="/"
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

        <Route
          path="/nuisance"
          element={<NuisanceSearchPage />}
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