import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Registration from "./components/Register";
import Login from "./components/Login";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <>
      <Routes>
        <Route
          path="/register"
          element={
            <Registration loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
          }
        />
        <Route
          path="/login"
          element={<Login loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
        />
      </Routes>
    </>
  );
}

export default App;
