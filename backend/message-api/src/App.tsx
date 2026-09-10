import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import RegistrationPage from "./pages/RegistrationPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import CompletionPage from "./pages/CompletionPage.tsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistrationPage />} />
        <Route path="/confirm" element={<ConfirmationPage />} />
        <Route path="/complete" element={<CompletionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;