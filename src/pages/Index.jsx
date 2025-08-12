import FaultyTerminal from "../components/FaultyTerminal";
import TargetCursor from "../components/TargetCursor";
import { Link } from "react-router-dom";
import PixelButton from "../components/PixelButton";
import "../App.css";
import TextType from '../components/TextType';

export default function Index() {
  return (
    <>
      <TargetCursor/>
      <main className="h-screen flex flex-col justify-center items-center text-center">

      <FaultyTerminal
  className="fixed inset-0 -z-10 pointer-events-none"
  scale={3}
  gridMul={[3,1]}
  digitSize={0.8}
  timeScale={1.2}
  pause={false}
  scanlineIntensity={0.3}
  glitchAmount={1}
  flickerAmount={1}
  noiseAmp={1}
  chromaticAberration={0}
  dither={0}
  curvature={0}
  tint="#2E40DF"
  mouseReact={true}
  mouseStrength={0.5}
  pageLoadAnimation={false}
  brightness={0.6}
/>

        <TextType className="max-w-xl mt-6 text-lg text-text"
          text={[" Bienvenidx a una experiencia", "interactiva creada a partir", "de mi propia huella digital..."]}
          typingSpeed={75}
          pauseDuration={900}
          showCursor={false}
          clearOnLoop={false} 
          loop={false}

          cursorCharacter="|">
        </TextType>

        <div className="mt-10 flex gap-6">
          <Link to="/about">
          <PixelButton className="cursor-target">
        + Sobre el proyecto
      </PixelButton>
          </Link>

          <Link to="/explore">
          <PixelButton className="cursor-target">
          Explora mi huella
          </PixelButton>
          </Link>
        </div>
      </main>
    </>
  );
}
