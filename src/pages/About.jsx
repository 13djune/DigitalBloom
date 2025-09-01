import React from "react";
import TargetCursor from "../components/TargetCursor";
import PixelButton from "../components/PixelButton";
import FiltersInline from "../components/FiltersInline";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import PixelImg from "../components/PixelImg";
import Avatar from "../assets/img/avatar.png";
import BitMe from "../assets/img/BitMe.png";
import "../styles/about.css";
import "../index.css";
import MiniDotGrid from "../components/MiniDotGrid";
import { Link } from "react-router-dom";
import { platformImages, colorMapping, tagList } from "../utils/globalConfig";

export default function About() {
    const navigate = useNavigate();
    const platformsInfo = [
      { id: 1, name: "Spotify", description: "Esta es mi propia cuenta desde 2017. Para ir a algún sitio o concentrarme me pongo música.", color: colorMapping.SPOTIFY ,  tags: tagList.filter(tag => ["Música", "Entretenimiento", "Propio", "@email"].includes(tag.name)) },
      { id: 2, name: "YouTube", description: "Sobretodo lo uso para distraerme o para dormir, a veces para ver tutoriales.", color: colorMapping.YOUTUBE ,   tags: tagList.filter(tag => ["Vídeo", "Educativo", "Humor", "Entretenimiento", "Propio", "@email"].includes(tag.name)) },
      { id: 3, name: "TikTok", description: "Dejé de usarlo hace un tiempo pero aún tengo acceso a la cuenta. A veces lo uso para buscar cosas.", color: colorMapping.TIKTOK ,   tags: tagList.filter(tag => ["Inspiración", "Entretenimiento","Educativo", "Humor", "Social", "Propio", "#tlf"].includes(tag.name)) },
      { id: 4, name: "Instagram", description: "Es mi red social más usada, la tengo desde 2015 o así.", color: colorMapping.INSTAGRAM,tags: tagList.filter(tag =>["Social", "Educativo", "Entretenimiento","Inspiración", "Propio", "@email", "#tlf"].includes(tag.name)) },
      { id: 5, name: "iPhone", description: "Aquí se encontrarán los datos de aplicaciones como: Salud, Tiempo de uso,...", color: colorMapping.IPHONE,   tags: tagList.filter(tag => ["Salud", "Educativo", "Humor", "Utilidades", "Propio"].includes(tag.name)) },
      { id: 6, name: "WhatsApp", description: "Esta App es la que más uso de mensajería, ni me acuerdo cuándo empecé a usarla.", color: colorMapping.WHATSAPP,  tags: tagList.filter(tag => ["Mensajería", "Social", "Humor", "Propio", "#tlf"].includes(tag.name)) },
      { id: 7, name: "Streaming", description: "Esta sección se compone de plataformas como Netflix o Prime Video.", color: colorMapping.STREAMING, tags: tagList.filter(tag => ["Cine", "Series", "Entretenimiento", "Compartido", "@email"].includes(tag.name)) },
      { id: 8, name: "Google", description: "Todo lo que esté enlazado con esta plataforma, como Google Maps o Gmail, estará aquí.", color: colorMapping.GOOGLE,  tags: tagList.filter(tag => ["Utilidades", "Ubicaciones", "Mensajería", "Propio", "@email"].includes(tag.name)) },
    ];
    
    // --- LÓGICA DE NAVEGACIÓN ELIMINADA DE AQUÍ ---
    // Ya no necesitamos buildSearch ni handleExplore en esta página.

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <>
      <TargetCursor />

      <main className="about-page text-text bg-background min-h-screen">
        <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10 py-10 md:py-12">

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

          <section className="flex flex-row gap-10 md:gap-14 items-center">
            <div className=" w-[60dvw]">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-6 ">
                Digital Bloom
              </h1>
              <div className="space-y-6 leading-relaxed opacity-90">
              <p className="text-xl">
                Este proyecto es <span className=" text-accent">un autorretrato hecho con mi propia vida online. </span>
                Todo empezó por pura curiosidad: me puse a mirar la cantidad de datos que hay sobre mí en internet y aluciné. 
                Canciones que he escuchado, sitios donde he estado, horas de móvil… un montón de información a la que nunca había prestado atención. 
                Lo más chocante fue darme cuenta de que ahí estaba <span className=" text-accent">mi propia identidad.  </span>
                Pude ver perfectamente cómo han cambiado mis gustos, mis manías y mi forma de vivir con el paso de tiempo.
                </p>
                <p className="text-xl">
                Así que me pasé meses recopilando todo ese material, ordenándolo y buscando la forma de convertirlo en algo visual y creativo. 
                He cambiado algunas cosas para <span className="text-accent">proteger mi privacidad</span>, pero casi todo lo que se ve en la obra es el <span className=" text-accent"> rastro real</span> que he ido dejando.
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
                <p className="text-2xl text-accent ">
                  ¿Te animas a navegar en mi huella digital?
                   </p>
                   <Link to="/navigate">
                    <PixelButton className="cursor-target mt-[2rem]">
                        Navegar
                        <Icon icon="pixelarticons:map" width="18" height="18" />
                    </PixelButton>
                  </Link>
              </div>
            </div>
            <div className="relative w-[40dvw] h-[90dvh]">
              <MiniDotGrid className="absolute" />
            </div>
          </section>

          <section className="mt-10 md:mt-14">
            <p className="text-2xl text-accent">
                También puedes filtrar mi huella digital y explorar poco a poco:
            </p>
            {/* --- COMPONENTE SIMPLIFICADO --- */}
            <FiltersInline
              onReset={() => console.log("Reset filtros")}
            />
          </section>

          <section className="grid md:grid-cols-2 gap-12 md:gap-16 items-start mt-14 md:mt-20">
            <div className="relative">
                <PixelImg
                    firstContent={ <img src={Avatar} alt="An avatar of the author in pixelart style" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> }
                    secondContent={ <img src={BitMe} alt="The author in bitmap style" style={{ width: "100%", height: "100%", objectFit: "cover" , backgroundColor: '#00031E'}} /> }
                    gridSize={25}
                    pixelColor='#00031E'
                    animationStepDuration={0.8}
                    className="custom-pixel-card"
                />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide mb-4 flex flex-row items-center subjetivo-font">
                Belén (June) {" "}
                <span className="text-sm opacity-70 align-super text-primary p-2">23 años</span>
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="af-chip"><Icon icon="pixelarticons:briefcase-check" width="24" height="24" className="pr-2"/>UX/UI Designer</span>
                <span className="af-chip"><Icon icon="pixelarticons:home" width="24" height="24" className="pr-2"/>Cartagena, Murcia</span>
                <span className="af-chip"><Icon icon="pixelarticons:pin" width="24" height="24" className="pr-2"/>Madrid</span>
                <span className="af-chip"><Icon icon="pixelarticons:device-vibrate" width="24" height="24" className="pr-2"/>Gen Z</span>
                <span className="af-chip"><Icon icon="pixelarticons:volume-3" width="24" height="24" className="pr-2"/>Español | Inglés</span>
                <span className="af-chip"><Icon icon="pixelarticons:moon-stars" width="24" height="24" className="pr-2"/>Noctámbula</span>
                <span className="af-chip"><Icon icon="pixelarticons:drop" width="24" height="24" className="pr-2"/>Emocional</span>
                <span className="af-chip"><Icon icon="pixelarticons:lightbulb-on" width="24" height="24" className="pr-2"/>Curiosa</span>
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
                <div className="flex items-center justify-between">
                    <p className="text-xl subjetivo-font text-accent">Si quieres conocer un poco más de mi trabajo:</p>
                    <Link to="https://belencastillo.netlify.app/">
                        <PixelButton className="cursor-target">
                            Mi Portfolio <Icon icon="pixelarticons:contact" width="18" height="18" />
                        </PixelButton>
                    </Link>
                </div>
              </div>
            </div>
          </section>
         
          <section className="mt-14 md:mt-20 relative z-10 overflow-visible">
            <h3 className="text-4xl font-bold tracking-wide mb-4">MIS PLATAFORMAS</h3>
            <p className="text-xl mb-4">Se han elegido estas plataformas, por su comodidad para descargar los datos y su uso constante en mi vida / día a día.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-16 mb-8">
                {platformsInfo.map((platform) => (
                <div key={platform.id} className="relative aspect-square border-[4px] border-[#9ed6e2] bg-[#0c111c] flex items-center justify-center overflow-visible cursor-pointer"
                    style={{ backgroundColor: `${platform.color}80` }}
                    onMouseEnter={(e) => { const tooltip = e.currentTarget.querySelector('.platform-tooltip'); if (tooltip) tooltip.style.opacity = '1'; }}
                    onMouseLeave={(e) => { const tooltip = e.currentTarget.querySelector('.platform-tooltip'); if (tooltip) tooltip.style.opacity = '0'; }}>
                    <img src={platformImages[platform.id]} alt={platform.name} className="w-[60%] h-[60%] object-contain z-10 transition-transform duration-300 hover:scale-110 cursor-target" />
                    <div className="platform-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-6 py-4 text-xl rounded-md bg-[#073E4A] text-white border border-white/20 z-50 shadow opacity-0 transition-opacity duration-300 pointer-events-none w-[16rem]">
                    <strong>{platform.name}</strong><br />
                    {platform.description}
                    {platform.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-2 z-10">
                            {platform.tags.map(tag => (<span key={tag.name} className="text-sm bg-white/10 border border-white/20 px-2 py-0.5 rounded-full text-white">{tag.name}</span>))}
                        </div>
                    )}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#073E4A]" />
                    </div>
                </div>
                ))}
            </div>
            </section>
        </div>
      </main>
    </>
  );
}