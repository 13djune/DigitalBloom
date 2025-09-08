// TargetCursor.jsx
import { useEffect, useRef, useCallback, useMemo } from "react";
import { gsap } from "gsap";
import "../App.css";

// Guarda y lee la última pos del puntero entre montajes/rutas
const getLastMouse = () =>
  (typeof window !== "undefined" && window.__TARGET_CURSOR_LAST) || null;
const setLastMouse = (pos) => {
  if (typeof window !== "undefined") window.__TARGET_CURSOR_LAST = pos;
};

const TargetCursor = ({
  targetSelector = ".cursor-target",
  spinDuration = 4.5,
  hideDefaultCursor = true,
}) => {
  const cursorRef = useRef(null);
  const cornersRef = useRef(null);
  const spinTl = useRef(null);
  const dotRef = useRef(null);
  const activeTargetRef = useRef(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const resumeTimeoutRef = useRef(null);
  const currentTargetMoveRef = useRef(null);
  const currentLeaveHandlerRef = useRef(null);
  const isAnimatingToTargetRef = useRef(false);

  const constants = useMemo(
    () => ({ borderWidth: 3, cornerSize: 12, parallaxStrength: 0.00005 }),
    []
  );

  const moveCursor = useCallback((x, y, animate = true) => {
    if (!cursorRef.current) return;
    const tween = animate ? gsap.to : gsap.set;
    tween(cursorRef.current, { x, y, duration: 0.1, ease: "power3.out" });
  }, []);

  // POSICIÓN INICIAL → usar última posición global si existe (no centrar)
  useEffect(() => {
    if (!cursorRef.current) return;
  
    const last = getLastMouse();
    const x = last?.x ?? window.innerWidth / 2;
    const y = last?.y ?? window.innerHeight / 2;
  
    gsap.set(cursorRef.current, { xPercent: -50, yPercent: -50 });
    moveCursor(x, y, false); // 👈 mover sin animación
    lastMouseRef.current = { x, y };
  
    // 🔥 Forzamos evento para que el cursor se re-sincronice
    const fakeEvent = new MouseEvent("pointermove", {
      clientX: x,
      clientY: y,
      bubbles: true
    });
    window.dispatchEvent(fakeEvent); // 🧠 fuerza re-ejecución de posicionamiento
  
  }, [moveCursor]);
  

  // Timeline de giro
  const startSpin = useCallback(() => {
    if (!cursorRef.current) return;
    spinTl.current?.kill();
    spinTl.current = gsap
      .timeline({ repeat: -1 })
      .to(cursorRef.current, { rotation: "+=360", duration: spinDuration, ease: "none" });
  }, [spinDuration]);

  // Poner corners en reposo + reanudar giro
  const resetCursor = useCallback(() => {
    const cursor = cursorRef.current;
    const corners = cornersRef.current ? Array.from(cornersRef.current) : [];
    if (!cursor || !corners.length) return;

    gsap.killTweensOf(corners);
    const { cornerSize } = constants;
    const positions = [
      { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
      { x:  cornerSize * 0.5, y: -cornerSize * 1.5 },
      { x:  cornerSize * 0.5, y:  cornerSize * 0.5 },
      { x: -cornerSize * 1.5, y:  cornerSize * 0.5 },
    ];
    const tl = gsap.timeline();
    corners.forEach((corner, i) => {
      tl.to(corner, { x: positions[i].x, y: positions[i].y, duration: 0.3, ease: "power3.out" }, 0);
    });

    gsap.set(cursor, { rotation: 0 });
    startSpin();
  }, [constants, startSpin]);

  useEffect(() => {
    if (!cursorRef.current) return;

    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) document.body.style.cursor = "none";

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll(".target-cursor-corner");

    const cleanupTarget = (target) => {
      if (!target) return;
      if (currentTargetMoveRef.current) target.removeEventListener("mousemove", currentTargetMoveRef.current);
      if (currentLeaveHandlerRef.current) target.removeEventListener("mouseleave", currentLeaveHandlerRef.current);
      currentTargetMoveRef.current = null;
      currentLeaveHandlerRef.current = null;
    };

    // spin inicial
    startSpin();

    // mover cursor: usa pointermove global para no depender de jerarquía/z-index
    const moveHandler = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      lastMouseRef.current = { x, y };
      setLastMouse({ x, y });      // ← persistimos entre páginas
      moveCursor(x, y);
    };
    window.addEventListener("pointermove", moveHandler, { passive: true });

    // scroll: si ya no estás sobre el target, disparar leave
    const scrollHandler = () => {
      const activeTarget = activeTargetRef.current;
      if (!activeTarget) return;
      const { x, y } = lastMouseRef.current;
      const el = document.elementFromPoint(x, y);
      const stillOver =
        el && (el === activeTarget || (el.closest && el.closest(targetSelector) === activeTarget));
      if (!stillOver && currentLeaveHandlerRef.current) {
        currentLeaveHandlerRef.current();
      }
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });

    // click feedback
    const mouseDownHandler = () => {
      if (!dotRef.current || !cursorRef.current) return;
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.2 });
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 });
    };
    const mouseUpHandler = () => {
      if (!dotRef.current || !cursorRef.current) return;
      gsap.to(dotRef.current, { scale: 1, duration: 0.2 });
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
      if (!activeTargetRef.current) resetCursor();
    };
    window.addEventListener("mousedown", mouseDownHandler);
    window.addEventListener("mouseup", mouseUpHandler);

    // click dentro de target => salir de modo target
    const clickHandler = (e) => {
      const t = e.target.closest?.(targetSelector);
      if (t && t === activeTargetRef.current) {
        cleanupTarget(t);
        activeTargetRef.current = null;
        resetCursor();
      }
    };
    window.addEventListener("click", clickHandler, true);

    // hover sobre targets
    const enterHandler = (e) => {
      let current = e.target;
      let target = null;
      while (current && current !== document.body) {
        if (current.matches?.(targetSelector)) { target = current; break; }
        current = current.parentElement;
      }
      if (!target || !cursorRef.current || !cornersRef.current) return;
      if (activeTargetRef.current === target) return;

      if (activeTargetRef.current) cleanupTarget(activeTargetRef.current);
      if (resumeTimeoutRef.current) { clearTimeout(resumeTimeoutRef.current); resumeTimeoutRef.current = null; }

      activeTargetRef.current = target;

      gsap.killTweensOf(cursorRef.current, "rotation");
      spinTl.current?.pause();
      gsap.set(cursorRef.current, { rotation: 0 });

      const updateCorners = (mouseX, mouseY) => {
        const rect = target.getBoundingClientRect();
        const cursorRect = cursorRef.current.getBoundingClientRect();
        const cx = cursorRect.left + cursorRect.width / 2;
        const cy = cursorRect.top + cursorRect.height / 2;

        const [tlc, trc, brc, blc] = Array.from(cornersRef.current);
        const { borderWidth, cornerSize, parallaxStrength } = constants;

        let tl = { x: rect.left  - cx - borderWidth,               y: rect.top    - cy - borderWidth };
        let tr = { x: rect.right - cx + borderWidth - cornerSize,  y: rect.top    - cy - borderWidth };
        let br = { x: rect.right - cx + borderWidth - cornerSize,  y: rect.bottom - cy + borderWidth - cornerSize };
        let bl = { x: rect.left  - cx - borderWidth,               y: rect.bottom - cy + borderWidth - cornerSize };

        if (mouseX != null && mouseY != null) {
          const tx = rect.left + rect.width / 2;
          const ty = rect.top  + rect.height / 2;
          const ox = (mouseX - tx) * parallaxStrength;
          const oy = (mouseY - ty) * parallaxStrength;
          tl.x += ox; tl.y += oy; tr.x += ox; tr.y += oy; br.x += ox; br.y += oy; bl.x += ox; bl.y += oy;
        }

        const tlm = gsap.timeline();
        [tlc, trc, brc, blc].forEach((corner, i) => {
          const off = [tl, tr, br, bl][i];
          tlm.to(corner, { x: off.x, y: off.y, duration: 0.2, ease: "power2.out" }, 0);
        });
      };

      isAnimatingToTargetRef.current = true;
      updateCorners();
      setTimeout(() => { isAnimatingToTargetRef.current = false; }, 1);

      let raf = null;
      const targetMove = (ev) => {
        if (raf || isAnimatingToTargetRef.current) return;
        raf = requestAnimationFrame(() => { updateCorners(ev.clientX, ev.clientY); raf = null; });
      };

      const leaveHandler = () => {
        cleanupTarget(target);
        activeTargetRef.current = null;
        isAnimatingToTargetRef.current = false;
        resetCursor();
        resumeTimeoutRef.current = setTimeout(() => {
          if (!activeTargetRef.current) startSpin();
          resumeTimeoutRef.current = null;
        }, 50);
      };

      currentTargetMoveRef.current = targetMove;
      currentLeaveHandlerRef.current = leaveHandler;
      target.addEventListener("mousemove", targetMove);
      target.addEventListener("mouseleave", leaveHandler);
    };

    window.addEventListener("mouseover", enterHandler, { passive: true });

    return () => {
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("mouseover", enterHandler);
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("mousedown", mouseDownHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
      window.removeEventListener("click", clickHandler, true);

      if (activeTargetRef.current) cleanupTarget(activeTargetRef.current);

      spinTl.current?.kill();
      document.body.style.cursor = originalCursor;
    };
  }, [targetSelector, moveCursor, constants, hideDefaultCursor, resetCursor, startSpin]);

  // si cambia la duración del spin, reiniciamos
  useEffect(() => { if (cursorRef.current) startSpin(); }, [spinDuration, startSpin]);

  return (
    <div ref={cursorRef} className="target-cursor-wrapper" aria-hidden>
      <div ref={dotRef} className="target-cursor-dot" />
      <div className="target-cursor-corner corner-tl" />
      <div className="target-cursor-corner corner-tr" />
      <div className="target-cursor-corner corner-br" />
      <div className="target-cursor-corner corner-bl" />
    </div>
  );
};

export default TargetCursor;
