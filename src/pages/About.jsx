import React, {  useState } from "react";
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
import CustomTooltip from "../components/CustomTooltip";
import "../styles/Tooltip.css";
import PixelLink from '../components/PixelLink';
import InteractiveText from '../components/InteractiveText';
import TextType from '../components/TextType';

const CensorshipOverlay = () => (
  <div 
    className="absolute inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
    style={{ 
      backdropFilter: "blur(25px)", 
      WebkitBackdropFilter: "blur(25px)", 
      backgroundColor: "rgba(0, 3, 30, 0.95)", 
      border: "3px solid #A1E6F6" 
    }}
  >
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" id="Interface-Essential-Stop-Sign-2--Streamline-Pixel" height="32" width="32">
  <desc>
    Interface Essential Stop Sign 2 Streamline Icon: https://streamlinehq.com
  </desc>
  <title>interface-essential-stop-sign-2</title>
  <g>
    <path d="M30.48 6.09h-1.53V4.57h-1.52V3.05h-1.52V1.52h-1.53V0H7.62v1.52H6.1v1.53H4.57v1.52H3.05v1.52H1.53v1.53H0v16.76h1.53v1.52h1.52v1.53h1.52v1.52H6.1v1.53h1.52V32h16.76v-1.52h1.53v-1.53h1.52v-1.52h1.52V25.9h1.53v-1.52H32V7.62h-1.52Zm-1.53 18.29h-1.52v1.52h-1.52v1.53h-1.53v1.52H7.62v-1.52H6.1V25.9H4.57v-1.52H3.05V7.62h1.52V6.09H6.1V4.57h1.52V3.05h16.76v1.52h1.53v1.52h1.52v1.53h1.52Z" fill="#A1E6F6" stroke-width="1"></path>
    <path d="M27.43 7.62h-1.52V6.09h-1.53V4.57H7.62v1.52H6.1v1.53H4.57v16.76H6.1v1.52h1.52v1.53h16.76V25.9h1.53v-1.52h1.52Zm-4.57 16.76h-1.52v1.52h-9.15v-1.52h-1.52v-3.05H9.15v-1.52H7.62v-1.53H6.1v-3.04h3.05v1.52h1.52v1.52h1.52V7.62h1.53v9.14h1.52V6.09h1.52v10.67h1.53V7.62h1.52v9.14h1.53v-6.09h1.52Z" fill="#A1E6F6" stroke-width="1"></path>
    <path d="M18.29 21.33h1.52v1.53h-1.52Z" fill="#A1E6F6" stroke-width="1"></path>
    <path d="M18.29 18.28h1.52v1.53h-1.52Z" fill="#A1E6F6" stroke-width="1"></path>
    <path d="M15.24 22.86h3.05v1.52h-3.05Z" fill="#A1E6F6" stroke-width="1"></path>
    <path d="M13.72 21.33h1.52v1.53h-1.52Z" fill="#A1E6F6" stroke-width="1"></path>
    <path d="M13.72 18.28h1.52v1.53h-1.52Z" fill="#A1E6F6" stroke-width="1"></path>
  </g>
</svg>
  </div>
);

export default function About() {
    const navigate = useNavigate();
    const platformsInfo = [
      { id: 1, name: "Spotify", description: "Esta es mi propia cuenta desde 2017. Para ir a algún sitio o concentrarme me pongo música.", color: colorMapping.SPOTIFY ,  tags: tagList.filter(tag => ["Música", "Entretenimiento", "Propio", "@email"].includes(tag.name)) },
      { id: 2, name: "YouTube", description: "Sobretodo lo uso para distraerme o para dormir, a veces para ver tutoriales.", color: colorMapping.YOUTUBE ,   tags: tagList.filter(tag => ["Vídeo", "Educativo", "Humor", "Entretenimiento", "Propio", "@email"].includes(tag.name)) },
      { id: 3, name: "TikTok", description: "Dejé de usarlo hace un tiempo pero aún tengo acceso a la cuenta. A veces lo uso para buscar cosas.", color: colorMapping.TIKTOK ,   tags: tagList.filter(tag => ["Inspiración", "Entretenimiento","Educativo", "Humor", "Social", "Propio", "#tlf"].includes(tag.name)) },
      { id: 4, name: "Instagram", description: "Es mi red social más usada, la tengo desde 2015. Aquí suelo pasar bastantes más horas que en otras apps", color: colorMapping.INSTAGRAM,tags: tagList.filter(tag =>["Social", "Educativo", "Entretenimiento","Inspiración", "Propio", "@email", "#tlf"].includes(tag.name)) },
      { id: 5, name: "iPhone", description: "Aquí se encontrarán los datos de aplicaciones como: Salud, Tiempo de uso,... Todo lo que hay en mi móvil personal.", color: colorMapping.IPHONE,   tags: tagList.filter(tag => ["Salud", "Educativo", "Humor", "Utilidades", "Propio"].includes(tag.name)) },
      { id: 6, name: "WhatsApp", description: "Esta App es la que más uso de mensajería, ni me acuerdo cuándo empecé a usarla. Todos mis conocidos usan esta app.", color: colorMapping.WHATSAPP,  tags: tagList.filter(tag => ["Mensajería", "Social", "Humor", "Propio", "#tlf"].includes(tag.name)) },
      { id: 7, name: "Streaming", description: "Esta sección se compone de plataformas como Netflix, Prime Video o HBO Max. Siempre me ha gustado ver series o películas, sola o acompañada.", color: colorMapping.STREAMING, tags: tagList.filter(tag => ["Cine", "Series", "Entretenimiento", "Compartido", "@email"].includes(tag.name)) },
      { id: 8, name: "Google", description: "Todo lo que esté enlazado con esta plataforma, como Google Maps (activé el seguimiento por cronología una temporada) o Gmail, estará aquí. Algunos datos se han modificado por temas de privacidad.", color: colorMapping.GOOGLE,  tags: tagList.filter(tag => ["Utilidades", "Ubicaciones", "Mensajería", "Propio", "@email"].includes(tag.name)) },
    ];

    const [tooltip, setTooltip] = useState({ 
      visible: false, 
      text: "", 
      targetRect: null 
    });

    const handleMouseEnter = (e) => {
      const text = e.currentTarget.getAttribute('data-tooltip');
      const rect = e.currentTarget.getBoundingClientRect();
      if (text && rect) {
        setTooltip({ visible: true, text, targetRect: rect });
      }
    };
    
    const handleMouseLeave = () => {
      setTooltip(prev => ({ ...prev, visible: false, targetRect: null }));
    };
  

  return (
    <>
      <CustomTooltip 
        text={tooltip.text} 
        visible={tooltip.visible} 
        targetRect={tooltip.targetRect} 
      />
      <main className="about-page text-text bg-background min-h-screen">
        <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10 py-10 md:py-12">

          <div className="mb-6">
            <PixelLink onClick={() => navigate(-1)}
              id="btn-back-to-explore" className="round-cta cursor-target fixed top-10 left-8" aria-label="Volver"
              data-tooltip="Volver" onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}>
              <Icon icon="pixelarticons:arrow-left" width="28" height="28" />
            </PixelLink>
          </div>

          <section className="flex flex-row gap-10 md:gap-14 items-center">
            <div className=" w-[60dvw]">
              <InteractiveText className="text-4xl md:text-5xl font-extrabold tracking-wide mb-6"
                text={"Digital Bloom"}
                typingSpeed={60}
                pauseDuration={2000}
                loop={true}
                showCursor={true}
                cursorCharacter="|">
              </InteractiveText>
           
              <div className="space-y-6 leading-relaxed opacity-90">
                <p className="text-xl">
                  Este proyecto es <span className=" text-accent">un autorretrato hecho con mi propia vida online, hecho con toda esa información invisible que soltamos por ahí. </span>
                  Todo empezó por pura curiosidad: me puse a mirar la cantidad de datos que hay sobre mí en internet y aluciné. 
                  Canciones que he escuchado, sitios donde he estado, horas de móvil… un montón de información a la que nunca había prestado atención. 
                  Lo más chocante fue darme cuenta de que ahí estaba <span className=" text-accent">mi propia identidad. </span>
                  Pude ver perfectamente cómo han cambiado mis gustos, mis manías y mi forma de vivir con el paso de tiempo.
                </p>
                <p className="text-xl">
                  Así que me pasé meses recopilando todo ese material, ordenándolo y buscando la forma de convertirlo en algo visual y creativo. 
                  He cambiado algunas cosas para <span className="text-accent">proteger mi privacidad</span>, pero casi todo lo que se ve en la obra es el <span className=" text-accent"> rastro real</span> que he ido dejando.
                </p>
                <p className="text-xl">
                  Para dar sentido a esta marabunta de información, la he organizado en <span className=" text-accent">tres niveles de conciencia</span>, que van desde lo más consciente (<span className=" text-accent">deseo</span>, que reflejan gustos e intereses), pasando por lo cotidiano (<span className=" text-accent">cuerpo</span>, que reflejan la presencia y actividad física), hasta lo más involuntario (<span className=" text-accent">rastro</span>, más pasivos e inconscientes). Además, todo se puede explorar en distintos <span className=" text-accent">periódos de tiempo</span> (últimas 4 semanas, últimos 6 meses, y último año o más) para ver la evolución.
                </p>
                <p className="text-xl">
                  Es importante entender que cada periodo funciona como un espacio independiente, no se acumulan. Al elegir "últimos 6 meses", por ejemplo, verás únicamente los datos de ese fragmento de tiempo, permitiendo una comparación más limpia entre el "yo" de antes y el de ahora. En algunos datos también encontrarás <span className=" text-accent">notas personales</span> que he añadido para explicar su significado o contexto.
                </p>
                <p className="text-xl">
                  Para añadir aún más contexto, verás que algunos datos incluyen <span className=" text-accent">notas personales</span> y también una serie de <span className=" text-accent">etiquetas (tags)</span> que revelan su naturaleza. Con ellas distingo si un dato fue generado de forma <strong className="text-accent">Consciente</strong> o si, por el contrario, fue <strong className="text-accent">Inconsciente</strong> y me sorprendió encontrarlo. También señalo si es algo <strong className="text-accent">Propio</strong> (hecho por mí), <strong className="text-accent">Compartido</strong> (hecho con alguien más) o incluso <strong className="text-accent">Contaminado</strong>, cuando alguien usó mi cuenta y dejó una huella que no es la mía.
                </p>
                <p className="text-xl">
                  La idea es <span className=" text-accent">invitarte a que explores y pienses en la historia que se esconde detrás de nuestros datos</span>, y en cómo las cosas más normales del día a día pueden acabar siendo algo muy propio.
                </p>
                <p className="text-2xl text-accent ">
                  ¿Te animas a ver todo lo que hay en mi huella digital?
                </p>
                <PixelLink to="/navigate">
                  <PixelButton className="cursor-target mt-[2rem]">
                    Navegar
                    <Icon icon="pixelarticons:map" width="18" height="18" />
                  </PixelButton>
                </PixelLink>
              </div>
            </div>
            <div className="relative w-[40dvw] h-[120dvh]">
              <MiniDotGrid className="absolute" />
            </div>
          </section>

          <section className="mt-10 md:mt-14">
            <TextType className="text-2xl text-accent"
              text={"También puedes filtrar mi huella digital y explorar poco a poco:"}
              typingSpeed={75}
              pauseDuration={900}
              showCursor={false}
              clearOnLoop={false} 
              loop={false}
              cursorCharacter="|">
            </TextType>
               
            <FiltersInline
              onReset={() => console.log("Reset filtros")}
            />
          </section>
<section>
  <div className="flex justify-center">
    <h3 className="text-2xl font-bold tracking-wide mb-4 mt-14 md:mt-20 text-accent">Se han censurado información sobre lx autorx para mantener el anonimato para los premios ADG Laus 2026.</h3>
  </div>
</section>
          <section className="grid md:grid-cols-2 gap-12 md:gap-16 items-start mt-14 md:mt-20">
            {/* IMAGEN CENSURADA */}
            <div className="relative">
                <CensorshipOverlay />
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
                {/* NOMBRE CENSURADO */}
                <div className="relative inline-block mb-4">
                  <CensorshipOverlay />
                  <InteractiveText className="text-3xl md:text-4xl font-extrabold tracking-wide flex flex-row items-center subjetivo-font"
                    text={" Belén (June) "}
                    typingSpeed={75}
                    pauseDuration={900}
                    showCursor={true}
                    clearOnLoop={false} 
                    loop={false}
                    cursorCharacter="|">
                  </InteractiveText>
                  <span className="text-lg opacity-80 align-super text-primary p-2 subjetivo-font">23 años</span>
                  <span className="text-lg opacity-80 align-super text-primary p-2 subjetivo-font">she/they</span>
                </div>

                {/* LOS 8 CHIPS - VISIBLES */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="af-chip"><Icon icon="pixelarticons:briefcase-check" width="24" height="24" className="pr-2"/>UX/UI Designer</span>
                  {/* <span className="af-chip"><Icon icon="pixelarticons:home" width="24" height="24" className="pr-2"/>Cartagena, Murcia</span> */}
                  <span className="af-chip"><Icon icon="pixelarticons:pin" width="24" height="24" className="pr-2"/>Madrid</span>
                  <span className="af-chip"><Icon icon="pixelarticons:device-vibrate" width="24" height="24" className="pr-2"/>Gen Z</span>
                  <span className="af-chip"><Icon icon="pixelarticons:volume-3" width="24" height="24" className="pr-2"/>Español | Inglés</span>
                  <span className="af-chip"><Icon icon="pixelarticons:moon-stars" width="24" height="24" className="pr-2"/>Noctámbulx</span>
                  <span className="af-chip"><Icon icon="pixelarticons:drop" width="24" height="24" className="pr-2"/>Emocional</span>
                  <span className="af-chip"><Icon icon="pixelarticons:lightbulb-on" width="24" height="24" className="pr-2"/>Curiosx</span>
                </div>

                <div className="space-y-6 leading-relaxed opacity-90">
                  {/* PRIMER PÁRRAFO CENSURADO */}
                  <div className="relative">
                    <CensorshipOverlay />
                    <p className="text-xl">
                    ¡Hola! Soy Belén (o June para mis amigos), una diseñadora UX/UI de Cartagena, pero ahora estoy en Madrid, siempre metida en algún proyecto y aprendiendo algo nuevo.
                    </p>
                  </div>
                  
                  <p className="text-xl">
                  Me flipa entender qué pasa entre las personas y las pantallas. Sobre todo, me obsesiona cómo nuestros datos o nuestra vida online pueden usarse para crear experiencias que de verdad te lleguen y signifiquen algo.
                  </p>
                  <p className="text-xl">
                  Me muevo un poco entre el diseño, el arte digital y la investigación, porque me encanta mezclar la parte técnica con un toque más humano y poético. 
                  Siendo de la generación Z, mi relación con internet es... intensa. Es un caos a veces, pero también es mi mayor fuente de inspiración y el sitio donde encuentro nuevas formas de contar historias.
                  </p>
                  
                  {/* BLOQUE PORTFOLIO CENSURADO */}
                  <div className="relative p-2 rounded-lg">
                      <CensorshipOverlay />
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