import { Routes, Route } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import Home from "@/pages/Home";
import Checkout from "@/pages/Checkout";
import Track from "@/pages/Track";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Checkout />} />
        <Route path="/track" element={<Track />} />
        <Route path="/track/:orderNumber" element={<Track />} />
      </Route>
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
