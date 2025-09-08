import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";
import TargetCursor from "./components/TargetCursor";
import Navigate from './pages/Navigate';

import AnimatedLayout from "./components/AnimatedLayout"; 

export default function App() {
  return (
    <>
      <TargetCursor targetSelector=".cursor-target"/>
      
      <Routes>
        <Route 
          element={<AnimatedLayout gridSize={20} animationDuration={1.2} />}
        >
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/navigate" element={<Navigate />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}