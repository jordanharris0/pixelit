import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Register from "./components/register-login/Register";
import Login from "./components/register-login/Login";
import Canvas from "./components/canvas/Canvas";

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/canvas" element={<Canvas />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
