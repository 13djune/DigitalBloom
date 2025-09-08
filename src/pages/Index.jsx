import FaultyTerminal from "../components/FaultyTerminal";
import PixelLink from '../components/PixelLink';
import PixelButton from "../components/PixelButton";
import "../App.css";
import TextType from '../components/TextType';
import Logo from '../assets/img/LOGO.png';
import Flor from '../assets/img/FLOR.GIF';
import { Icon } from "@iconify/react";

export default function Index() {
  return (
    <>
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
<div className="fixed top-0 m-6 flex flex-col items-center">
<img src={Logo} alt="Logo" className="w-4/5 " />

<img src={Flor} alt="Animación" className="w-32 h-auto mb-6" />

</div>

        <TextType className="max-w-xl mt-10 text-3xl text-text fixed bottom-[30%]"
          text={[" Bienvenidx a una experiencia interactiva creada a partir", "de mi propia huella digital..."]}
          typingSpeed={75}
          pauseDuration={900}
          showCursor={true}
          clearOnLoop={false} 
          loop={false}

          cursorCharacter="|">
        </TextType>

        <div className="m-10 flex gap-24  fixed bottom-[3rem]">
          <PixelLink to="/about">
          <PixelButton className="cursor-target">
        + Sobre el proyecto
        <Icon icon="pixelarticons:lightbulb-2" width="18" height="18" />

      </PixelButton>
          </PixelLink>

          <PixelLink to="/explore">
          <PixelButton className="cursor-target">
          Explora mi huella
          <Icon icon="pixelarticons:search" width="18" height="18" />
          </PixelButton>
          </PixelLink>
        </div>
      </main>
    </>
  );
}
