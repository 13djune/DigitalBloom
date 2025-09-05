"use client";

import { useEffect, useRef, useState, createElement } from "react";
import { gsap } from "gsap";
import "../App.css";

const TextType = ({
  text,
  as: Component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  // deletingSpeed ya no se usa si hacemos saltos de línea
  loop = true,
  className = "",
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = "|",
  cursorClassName = "",
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,

  /** NUEVO: hacer salto de línea entre frases */
  lineBreakBetween = true,
  /** NUEVO: al reiniciar (loop) limpiar el bloque y volver a empezar */
  clearOnLoop = true,

  ...props
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const cursorRef = useRef(null);
  const containerRef = useRef(null);

  const textArray = Array.isArray(text) ? text : [text];

  const getRandomSpeed = () => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  };

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return "#ffffff";
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setIsVisible(true)),
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode
      ? currentText.split("").reverse().join("")
      : currentText;

    const typeNext = () => {
      // Si aún quedan caracteres por escribir en esta frase
      if (currentCharIndex < processedText.length) {
        timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + processedText[currentCharIndex]);
          setCurrentCharIndex((prev) => prev + 1);
        }, variableSpeed ? getRandomSpeed() : typingSpeed);
        return;
      }

      // Frase terminada
      if (onSentenceComplete) {
        onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
      }

      const isLast = currentTextIndex === textArray.length - 1;

      if (isLast) {
        // Última frase
        if (loop) {
          // Pausa y reinicia (opción clearOnLoop)
          timeout = setTimeout(() => {
            if (clearOnLoop) setDisplayedText("");
            setCurrentTextIndex(0);
            setCurrentCharIndex(0);
          }, pauseDuration);
        }
        // Si no hay loop: simplemente termina
        return;
      } else {
        // No es la última: pasar a la siguiente
        timeout = setTimeout(() => {
          if (lineBreakBetween) {
            setDisplayedText((prev) => prev + "\n");
          }
          setCurrentTextIndex((prev) => prev + 1);
          setCurrentCharIndex(0);
        }, pauseDuration);
      }
    };

    if (currentCharIndex === 0 && displayedText === "") {
      timeout = setTimeout(typeNext, initialDelay);
    } else {
      typeNext();
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentCharIndex,
    displayedText,
    typingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete,
    lineBreakBetween,
    clearOnLoop,
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping &&
    currentCharIndex < (textArray[currentTextIndex] || "").length;

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `text-type ${className}`,
      ...props,
    },
    <span
      className="text-type__content"
      style={{
        color: getCurrentTextColor(),
        whiteSpace: "pre-wrap", 
      }}
    >
      {displayedText}
    </span>,
    showCursor && (
      <span
        ref={cursorRef}
        className={`text-type__cursor ${cursorClassName} ${
          shouldHideCursor ? "text-type__cursor--hidden" : ""
        }`}
      >
        {cursorCharacter}
      </span>
    )
  );
};

export default TextType;
