import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Router from "./components/Router";

import Home             from "./pages/Home";
import Login            from "./pages/Login";
import Movies           from "./pages/Movies";
import Screenings       from "./pages/Screenings";
import Theaters         from "./pages/Theaters";
import Tickets          from "./pages/Tickets";
import Account          from "./pages/Account";
import Stars            from "./pages/Stars";
import AdminDashboard   from "./pages/AdminDashboard";
import ScheduleScreening from "./pages/ScheduleScreening";
import CapacityMonitor  from "./pages/CapacityMonitor";
import Analytics        from "./pages/Analytics";

// redirect admins away from the home page straight to their dashboard
function HomeRoute() {
  const role = localStorage.getItem("loggedInRole");
  return role === "admin" ? <Navigate to="/admin" replace /> : <Home />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Router />
      <main>
        <Routes>
          <Route path="/"                element={<HomeRoute />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/movies"          element={<Movies />} />
          <Route path="/screenings"      element={<Screenings />} />
          <Route path="/theaters"        element={<Theaters />} />
          <Route path="/tickets"         element={<Tickets />} />
          <Route path="/account"         element={<Account />} />
          <Route path="/stars"           element={<Stars />} />
          <Route path="/admin"           element={<AdminDashboard />} />
          <Route path="/admin/schedule"  element={<ScheduleScreening />} />
          <Route path="/admin/capacity"  element={<CapacityMonitor />} />
          <Route path="/admin/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}