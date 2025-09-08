import { useOutletContext } from 'react-router-dom';

export default function PixelLink({ to, onClick, children, ...props }) {
  const { animateAndNavigate } = useOutletContext();

  const handleClick = (e) => {
    e.preventDefault();
    if (props.onClick) props.onClick(e); // Soporte para onMouseEnter, etc.

    if (to) {
      animateAndNavigate(to);
    } else if (onClick) {
      // Para goBack u otra función personalizada
      animateAndNavigate(null, onClick);
    }
  };

  return (
    <a href={to || '#'} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
