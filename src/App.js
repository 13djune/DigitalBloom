import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";
import TargetCursor from "./components/TargetCursor";

export default function App() {
  return (
    <>
      <TargetCursor />
    <div>

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
    </>
  );
}
