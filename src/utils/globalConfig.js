// src/utils/globalConfig.js
import '../styles/filters.css'
import spotifyImg from '../assets/img/SPOTIFY.PNG';
import youtubeImg from '../assets/img/YOUTUBE.PNG';
import tiktokImg from '../assets/img/TIKTOK.PNG';
import instagramImg from '../assets/img/INSTAGRAM.PNG';
import iphoneImg from '../assets/img/IPHONE.PNG';
import whatsappImg from '../assets/img/WHATSAPP.PNG';
import streamingImg from '../assets/img/STREAMING.PNG';
import googleImg from '../assets/img/GOOGLE.PNG';

 export const tagList = [
    // consciencia
    { name: "Inconsciente", type: "consciencia" }, { name: "Propio", type: "consciencia" },
    { name: "Contaminado", type: "consciencia" }, { name: "Consciente", type: "consciencia" },
    { name: "Compartido", type: "consciencia" },
  
    // dispositivo
    { name: "Teléfono", type: "dispositivo" }, { name: "Ordenador", type: "dispositivo" },
    { name: "Televisión", type: "dispositivo" }, { name: "iPad", type: "dispositivo" },
  
    // state
    { name: "Liked", type: "state" }, { name: "Saved", type: "state" }, { name: "Bookmark", type: "state" }, { name: "Following", type: "state" },
  
    // meta
    { name: "@email", type: "meta" }, { name: "#tlf", type: "meta" },
  
    // topic
    { name: "Humor", type: "topic" }, { name: "Horror", type: "topic" },
    { name: "Drama", type: "topic" }, { name: "Acción", type: "topic" },
    { name: "Tranquilo", type: "topic" }, { name: "Educativo", type: "topic" },
    { name: "Ficción", type: "topic" }, { name: "Animación", type: "topic" },
    { name: "Videojuegos", type: "topic" }, { name: "Juegos", type: "topic" },
    { name: "Romance", type: "topic" }, { name: "Entretenimiento", type: "topic" },
    { name: "Música", type: "topic" }, { name: "Arte", type: "topic" }, { name: "Tecnología", type: "topic" },
    { name: "Salud", type: "topic" }, { name: "Movilidad", type: "topic" }, { name: "Viajes", type: "topic" },
    { name: "Comida", type: "topic" }, { name: "Cocina", type: "topic" }, { name: "Cine", type: "topic" },
    { name: "Series", type: "topic" }, { name: "Anime", type: "topic" }, { name: "Cómics", type: "topic" },
    { name: "Fotografía", type: "topic" }, { name: "Diseño", type: "topic" }, { name: "Moda", type: "topic" },
    { name: "Naturaleza", type: "topic" }, { name: "Ciencia", type: "topic" }, { name: "Política", type: "topic" },
    { name: "Noticias", type: "topic" }, { name: "Activismo", type: "topic" }, { name: "Finanzas", type: "topic" },
    { name: "Compras", type: "topic" }, { name: "Social", type: "topic" }, { name: "LGBTQ+", type: "topic" },
    { name: "Tattoo", type: "topic" }, { name: "Inspiración", type: "topic" }, { name: "Amigos", type: "topic" },
    { name: "Fantasía", type: "topic" }, { name: "Sit-com", type: "topic" }, { name: "Superhéroes", type: "topic" },
    { name: "Infantil", type: "topic" }, { name: "Competición", type: "topic" }, { name: "Celebrities", type: "topic" },
    { name: "Experimental", type: "topic" }, { name: "Crítica", type: "topic" }, { name: "Shitpost", type: "topic" },
    { name: "Memes", type: "topic" }, { name: "Zodiaco", type: "topic" }, { name: "Revista", type: "topic" },
    { name: "Música en vivo", type: "topic" }, { name: "Deportes", type: "topic" }, { name: "Cultura", type: "topic" },
    { name: "Negocios", type: "topic" }, { name: "Economía", type: "topic" }, { name: "Foros", type: "topic" },
    { name: "Comunidad", type: "topic" }, { name: "Vivienda", type: "topic" }, { name: "Inmobiliaria", type: "topic" },
    { name: "Clima", type: "topic" }, { name: "Meteorología", type: "topic" }, { name: "Reservas", type: "topic" },
    { name: "Turismo", type: "topic" }, { name: "Museo", type: "topic" }, { name: "Radio", type: "topic" },
  
    // genre
    { name: "Hip Hop", type: "genre" }, { name: "R&B", type: "genre" },
    { name: "Latin Trap", type: "genre" }, { name: "Rock", type: "genre" },
    { name: "Neo-Soul", type: "genre" }, { name: "Rap", type: "genre" },
    { name: "Hyperpop", type: "genre" }, { name: "Pop", type: "genre" },
    { name: "Funk", type: "genre" }, { name: "Electronic", type: "genre" },
    { name: "Techno", type: "genre" }, { name: "Synth-pop", type: "genre" },
    { name: "Alternative", type: "genre" }, { name: "K-Pop", type: "genre" },
    { name: "Indie Pop", type: "genre" }, { name: "Trap", type: "genre" },
    { name: "Soul", type: "genre" }, { name: "Flamenco Urbano", type: "genre" },
    { name: "Synth-rock", type: "genre" }, { name: "Tech House", type: "genre" },
    { name: "French House", type: "genre" }, { name: "Electroclash", type: "genre" },
    { name: "Folk", type: "genre" }, { name: "Art Pop", type: "genre" },
    { name: "Folktronica", type: "genre" }, { name: "Electropop", type: "genre" },
    { name: "Boom Bap", type: "genre" }, { name: "Alternative R&B", type: "genre" },
    { name: "Alt-Pop", type: "genre" }, { name: "Post-punk", type: "genre" },
    { name: "Electro", type: "genre" }, { name: "Latin Pop", type: "genre" },
    { name: "Salsa", type: "genre" }, { name: "Dance-Pop", type: "genre" },
    { name: "Alternative Rap", type: "genre" }, { name: "Latin Rap", type: "genre" },
    { name: "Reggaeton", type: "genre" }, { name: "Alternative Hip Hop", type: "genre" },
    { name: "Electronica", type: "genre" }, { name: "Bedroom Pop", type: "genre" },
    { name: "Indie Rock", type: "genre" }, { name: "Cumbia", type: "genre" },
    { name: "Folclore", type: "genre" }, { name: "Experimental", type: "genre" },
    { name: "Acústico", type: "genre" },
  
    // lang
    { name: "Español", type: "lang" }, { name: "Inglés", type: "lang" },
    { name: "Japonés", type: "lang" }, { name: "Coreano", type: "lang" },
    { name: "Otro", type: "lang" },
  
    // other
    { name: "Utilidades", type: "other" }, { name: "Comunicación", type: "other" },
    { name: "Redes Sociales", type: "other" }, { name: "Ubicaciones", type: "other" },
    { name: "Portfolio", type: "other" }, { name: "Programación", type: "other" },
    { name: "Web", type: "other" }, { name: "Apuntes", type: "other" },
    { name: "Accesibilidad", type: "other" }, { name: "Usabilidad", type: "other" },
    { name: "Privacidad", type: "other" }, { name: "Sugerencias", type: "other" },
    { name: "Mensajería", type: "other" }, { name: "Correo Electrónico", type: "other" },
    { name: "Llamadas", type: "other" },
  ];
  

  
  export const colorMapping = {
    SPOTIFY: '#22FF8E',
    YOUTUBE: '#FF5F5F',
    TIKTOK: '#A184FF',
    INSTAGRAM: '#FF8EDB',
    IPHONE: '#F5F84E',
    WHATSAPP: '#148500',
    STREAMING: '#FFBA3B',
    GOOGLE: '#77a9fa',
  };
  
  export const platformImages = {
    1: spotifyImg,
    2: youtubeImg,
    3: tiktokImg,
    4: instagramImg,
    5: iphoneImg,
    6: whatsappImg,
    7: streamingImg,
    8: googleImg,
  };