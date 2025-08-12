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
          className="inline-flex items-center gap-2 text-primary cursor-target"
          aria-label="Volver"
        >
          <Icon icon="pixelarticons:arrow-left" width={18} height={18} />
          <span>Volver</span>
        </button>
      </div>

          {/* Hero: título + texto / imagen */}
          <section className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide mb-6">
                TITULO DEL PROYECTO
              </h1>

              <div className="space-y-6 leading-relaxed opacity-90">
                <p>
                  LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO
                  EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA. UT
                  ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI
                  UT ALIQUIP EX EA COMMODO CONSEQUAT.
                </p>
                <p>
                  LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO
                  EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA. UT
                  ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI
                  UT ALIQUIP EX EA COMMODO CONSEQUAT.
                </p>
                <p>
                  LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO
                  EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA.
                </p>
              </div>
            </div>

            {/* Placeholder imagen con estilo “marco cian” */}
            <div className="relative">
              
            <div className="aspect-[4/5] w-full border-[6px] border-[#9ed6e2] bg-transparent" />

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
  gridSize={50}
  pixelColor='#A1E6F6'
  animationStepDuration={0.6}
  className="custom-pixel-card"
/>
            </div>

            {/* Detalles derecha */}
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide mb-4 flex flex-row items-center">
                Belen (June) {" "}
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
                <Icon icon="pixelarticons:device-vibrate" width="24" height="24" className="pr-2"/>

                </span>
                <span className="af-chip"></span>
              </div>

              <div className="space-y-6 leading-relaxed opacity-90">
                <p>
                  LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO
                  EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA. UT
                  ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS
                  NISI UT ALIQUIP EX EA COMMODO CONSEQUAT.
                </p>
                <p>
                  DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE
                  CILLUM DOLORE EU FUGIAT NULLA PARIATUR. EXCEPTEUR SINT OCCAECAT
                  CUPIDATAT NON PROIDENT.
                </p>
              </div>
            </div>
          </section>

          {/* Plataformas (cuadrícula de cuadrados) */}
          <section className="mt-14 md:mt-20">
            <h3 className="text-lg font-bold tracking-wide mb-4">PLATAFORMAS</h3>

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
              <Icon icon="pixelarticons:external-link" width={16} height={16} />
              Ver portfolio
            </PixelButton>
          </div>
        </div>
      </main>
    </>
  );
}
