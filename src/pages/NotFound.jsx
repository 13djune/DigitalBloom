import React from "react";
import TargetCursor from "../components/TargetCursor";
import FuzzyText from "../components/FuzzyText";

export default function NotFound() {
  return (
    <>
      <TargetCursor/>
      <main className="p-10 text-blue-200 bg-background w-full h-full">
        <div className="flex flex-col">

      <FuzzyText 
            fontSize="clamp(3rem, 14vw, 10rem)"
            fontWeight={900}
            color="#fff"
            enableHover={true}      
            baseIntensity={0.18}
            hoverIntensity={0.5}   
            >
            404
        </FuzzyText>
        
        <FuzzyText 
            fontSize="clamp(3rem, 14vw, 10rem)"
            fontWeight={900}
            color="#fff"
            enableHover={true}      
            baseIntensity={0.18}
            hoverIntensity={0.5}   
            >
            NotFound
        </FuzzyText>
        </div>
      </main>
    </>
  );
}
