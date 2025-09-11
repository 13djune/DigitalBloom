import React, { useEffect, useRef, useState, useMemo } from 'react';

// =================================================================================
// DecryptedText Component (Internal logic for the hover effect)
// =================================================================================
const DecryptedText = ({
  text,
  speed = 50,
  maxIterations = 15,
  encryptedClassName = '',
  ...props
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';
  const iterationRef = useRef(0);

  useEffect(() => {
    setDisplayText(text);
    setIsHovering(false);
    setIsScrambling(false);
    iterationRef.current = 0;
  }, [text]);

  useEffect(() => {
    let interval;
    if (isHovering) {
      setIsScrambling(true);
      const shuffle = (originalText) => originalText.split('').map(char => char === ' ' ? char : characters[Math.floor(Math.random() * characters.length)]).join('');
      interval = setInterval(() => {
        if (iterationRef.current < maxIterations) {
          setDisplayText(shuffle(text));
          iterationRef.current += 1;
        } else {
          clearInterval(interval);
          setIsScrambling(false);
          setDisplayText(text);
        }
      }, speed);
    } else {
      iterationRef.current = 0;
      setIsScrambling(false);
      setDisplayText(text);
    }
    return () => clearInterval(interval);
  }, [isHovering, text, speed, maxIterations]);

  return (
    <span
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="inline-block"
      {...props}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={isScrambling ? encryptedClassName : ''}>
        {displayText}
      </span>
    </span>
  );
};

// =================================================================================
// InteractiveText Component (Main component)
// =================================================================================
const InteractiveText = ({
  text,
  as: Component = "div",
  typingSpeed = 50,
  pauseDuration = 2000,
  loop = true,
  className = "",
  showCursor = false,
  cursorCharacter = "|",
  cursorClassName = "",
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const cursorRef = useRef(null);
  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  useEffect(() => {
    const gsap = window.gsap;
    if (gsap && showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, { opacity: 0, duration: 0.5, repeat: -1, yoyo: true });
    }
  }, [showCursor]);

  useEffect(() => {
    const currentText = textArray[currentTextIndex];
    if (!currentText) return;
    let timeout;
    if (isTyping && currentCharIndex < currentText.length) {
      timeout = setTimeout(() => {
        setDisplayedText(prev => prev + currentText[currentCharIndex]);
        setCurrentCharIndex(prev => prev + 1);
      }, typingSpeed);
    } else if (isTyping) {
      setIsTyping(false);
      const isLast = currentTextIndex === textArray.length - 1;
      if (!isLast || loop) {
        timeout = setTimeout(() => {
          const nextIndex = isLast ? 0 : currentTextIndex + 1;
          setDisplayedText("");
          setCurrentCharIndex(0);
          setCurrentTextIndex(nextIndex);
          setIsTyping(true);
        }, pauseDuration);
      }
    }
    return () => clearTimeout(timeout);
  }, [currentCharIndex, isTyping, textArray, currentTextIndex, loop, pauseDuration, typingSpeed]);

  const currentTextContent = textArray[currentTextIndex] || "";

  return (
    <Component className={`text-type ${className}`} {...props}>
      {isTyping
        ? <span className="text-type__content inline-block">{displayedText}</span>
        : <DecryptedText text={currentTextContent} encryptedClassName="scrambled-suffix" />
      }
      {showCursor && isTyping && (
        <span ref={cursorRef} className={`text-type__cursor ${cursorClassName}`}>
          {cursorCharacter}
        </span>
      )}
    </Component>
  );
};

export default InteractiveText;
