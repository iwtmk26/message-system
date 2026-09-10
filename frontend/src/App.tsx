import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import RegistrationPage from "./pages/RegistrationPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import CompletionPage from "./pages/CompletionPage.tsx";
import ListPage from "./pages/ListPage";
import DetailPage from "./pages/DetailPage";


function App() {
  return (
    <BrowserRouter>
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

      </Routes>
    </BrowserRouter>
  );
}

export default App;