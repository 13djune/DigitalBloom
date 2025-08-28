// src/pages/About.jsx
import React from "react";
import TargetCursor from "../components/TargetCursor";
import PixelButton from "../components/PixelButton";
import FiltersInline from "../components/FiltersInline";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import PixelImg from "../components/PixelImg";
import Avatar from "../assets/img/avatar.png";
import "../styles/about.css";
import "../index.css";
import MiniDotGrid from "../components/MiniDotGrid";

export default function About() {
    const navigate = useNavigate();

    const buildSearch = ({ level, time, platforms = [], tags = [] }) => {
      const sp = new URLSearchParams();
      if (level) sp.set("level", String(level));
      if (time) sp.set("time", String(time));
      platforms.forEach(p => sp.append("platform", String(p)));
      tags.forEach(t => sp.append("tag", t));
      return `?${sp.toString()}`;
    };
  
    const handleExplore = (payload) => {
      navigate({ pathname: "/explore", search: buildSearch(payload) });
    };

  const goBack = () => {
    // si hay historial, vuelve; si no, ve al home
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <>
      <TargetCursor />

      <main className="about-page text-text bg-background min-h-screen">
        {/* Contenedor principal */}
        <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10 py-10 md:py-12">

        {/* Volver */}
      <div className="mb-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-primary cursor-target fixed top-10 left-8 scale-[135%]"
          aria-label="Volver"
        >
          <Icon icon="pixelarticons:arrow-left" width={18} height={18} />
          <span>Volver</span>
        </button>
      </div>

          {/* Hero: título + texto / imagen */}
          <section className="flex flex-row gap-10 md:gap-14 items-center">
            <div className=" w-[60dvw]">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide mb-6">
                Digital Bloom
              </h1>

              <div className="space-y-6 leading-relaxed opacity-90">
              <p className="text-xl">
                Este proyecto es <span className=" text-accent">un autorretrato hecho con mi propia vida online. </span>
                Todo empezó por pura curiosidad: me puse a mirar la cantidad de datos que hay sobre mí en internet y aluciné. 
                Canciones que he escuchado, sitios donde he estado, horas de móvil… un montón de información a la que nunca había prestado atención. 
                Lo más chocante fue darme cuenta de que ahí estaba <span className=" text-accent">mi propia identidad.  </span>
                Pude ver perfectamente cómo han cambiado mis gustos, mis manías y mi forma de vivir con el paso del tiempo.
                </p>
                <p className="text-xl">
                Así que me pasé meses recopilando todo ese material, ordenándolo y buscando la forma de convertirlo en algo visual y creativo. 
                He cambiado algunas cosas paraproteger mi privacidad, pero casi todo lo que se ve en la obra es el <span className=" text-accent"> rastro real</span> que he ido dejando.
                </p>
                <p className="text-xl">
                El resultado es algo muy personal y abstracto. Es una especie de retrato vivo, hecho con toda esa información invisible que soltamos por ahí. 
                </p>
                <p className="text-xl">
                  Los datos se han dividido en <span className=" text-accent">tres niveles de conciencia</span>, que van desde lo más consciente (deseo) a lo más involuntario (rastro); y por <span className=" text-accent">periódos de tiempo </span>(últimas 4 semanas, últimos 6 meses, y último año o más).
                  Además, podrás encontrar en algunos datos con <span className=" text-accent">notas personales</span> que he añadido para explicar su significado o contexto.
                </p>
                <p className="text-xl">
                La idea es <span className=" text-accent">invitarte a que explores y pienses en la historia que se esconde detrás de nuestros datos</span>, y en cómo las cosas más normales del día a día pueden acabar siendo algo muy propio.

                </p>
                <p className="text-2xl text-accent font-semibold">
                  ¿Te animas a explorar mi huella digital?

                   </p>
              </div>
            </div>

            {/* Placeholder imagen con estilo “marco cian” */}
            <div className="relative w-[40dvw] h-[90dvh]">
              <MiniDotGrid className="absolute" />

            </div>
          </section>

          {/* ===== Filtros inline (NO popup) ===== */}
          <section className="mt-10 md:mt-14">
            <FiltersInline
              onApply={handleExplore}
              onReset={() => console.log("Reset filtros")}
            />
          </section>

          {/* Sección persona/proyecto */}
          <section className="grid md:grid-cols-2 gap-12 md:gap-16 items-start mt-14 md:mt-20">
            {/* Imagen izquierda */}
            <div className="relative">
            <PixelImg
  firstContent={
    <img
      src={Avatar}
      alt="An avatar of the author in pixelart style"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  }
  secondContent={
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#111"
      }}
    >
      <p style={{ fontWeight: 900, fontSize: "3rem", color: "#ffffff" }}>Meow!</p>
    </div>
  }
  gridSize={20}
  pixelColor='#00031E'
  animationStepDuration={1}
  className="custom-pixel-card"
/>
            </div>

            {/* Detalles derecha */}
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide mb-4 flex flex-row items-center subjetivo-font">
                Belén (June) {" "}
                <span className="text-sm opacity-70 align-super text-primary p-2">23 años</span>
              </h2>

              {/* Chips / etiquetas rápidas */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="af-chip">
                <Icon icon="pixelarticons:briefcase-check" width="24" height="24" className="pr-2"/>

                    UX/UI Designer</span>
                <span className="af-chip">
                <Icon icon="pixelarticons:home" width="24" height="24" className="pr-2"/>
                Cartagena, Murcia</span>
                <span className="af-chip">
                <Icon icon="pixelarticons:pin" width="24" height="24" className="pr-2"/>
                Madrid</span>
                <span className="af-chip">
                <Icon icon="pixelarticons:device-vibrate" width="24" height="24" className="pr-2"/>
                Gen Z
                </span>
                <span className="af-chip">
                <Icon icon="pixelarticons:volume-3" width="24" height="24" className="pr-2"/>
                Español | Inglés
                </span>
                <span className="af-chip">
                <Icon icon="pixelarticons:moon-stars" width="24" height="24" className="pr-2"/>

                Noctámbula
                </span>
                <span className="af-chip">
                <Icon icon="pixelarticons:drop" width="24" height="24" className="pr-2"/>

                Emocional
                </span>
                <span className="af-chip">
                <Icon icon="pixelarticons:lightbulb-on" width="24" height="24" className="pr-2"/>

                Curiosa
                </span>
              </div>

              <div className="space-y-6 leading-relaxed opacity-90">
                <p className="text-xl">
                ¡Hola! Soy Belén (o June para mis amigos), una diseñadora UX/UI de 23 años. Soy de Cartagena, pero ahora estoy en Madrid, siempre metida en algún proyecto y aprendiendo algo nuevo.
                 </p>
                <p className="text-xl">
                Me flipa entender qué pasa entre las personas y las pantallas. Sobre todo, me obsesiona cómo nuestros datos o nuestra vida online pueden usarse para crear experiencias que de verdad te lleguen y signifiquen algo.
                </p>
                <p className="text-xl">
                Me muevo un poco entre el diseño, el arte digital y la investigación, porque me encanta mezclar la parte técnica con un toque más humano y poético. 
                Siendo de la generación Z, mi relación con internet es... intensa. Es un caos a veces, pero también es mi mayor fuente de inspiración y el sitio donde encuentro nuevas formas de contar historias.
                </p>
              </div>
            </div>
          </section>

          {/* Plataformas (cuadrícula de cuadrados) */}
          <section className="mt-14 md:mt-20">
            <h3 className="text-lg font-bold tracking-wide mb-4">MIS PLATAFORMAS</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square border-[4px] border-[#9ed6e2] bg-transparent"
                />
              ))}
            </div>

            {/* Dos tarjetas de ejemplo, como en el mock */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-[#1b2a4a]/70 border border-white/15 rounded-md p-4">
                <div className="text-sm opacity-80">
                  Propio/Compartido<br />@, # ¿año?
                </div>
              </div>

              <div className="bg-[#1b2a4a]/70 border border-white/15 rounded-md p-4 flex items-center justify-between">
                <div className="font-semibold opacity-90">Ocultado</div>
                <div className="text-primary">
                  <Icon icon="pixelarticons:eye-closed" width={22} height={22} />
                </div>
              </div>
            </div>
          </section>

          {/* CTA final opcional */}
          <div className="mt-12 flex justify-end">
            <PixelButton className="cursor-target">
              Ver portfolio
              <Icon icon="pixelarticons:external-link" width={16} height={16} />
            </PixelButton>
          </div>
        </div>
      </main>
    </>
  );
}
