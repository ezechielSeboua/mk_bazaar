const BazaarPulse = ({ 
  imageSrc, 
  altText = "MK Bazaar Logo", 
  size = 200, 
  pulseColor = "#b38b41" 
}) => {
  const containerStyle = {
    '--pulse-color': pulseColor,
    width: `${size}px`,
    height: `${size}px`
  };

  return (
    <div className="bazaar-wrapper">
      <style>{`
        .bazaar-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 350px;
          width: 100%;
          background-color: #f9fafb;
        }

        .pulse-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Une seule vague par cycle */
        .pulse-wave {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-color: var(--pulse-color);
          opacity: 0;
          transform: scale(0.85);
          animation: bazaarPulse 1.5s ease-out infinite;
        }

        .image-center {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #ffffff;
          padding: 10px;
          box-shadow: 0 10px 30px -5px rgba(179, 139, 65, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(179, 139, 65, 0.15);
        }

        .image-center img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        @keyframes bazaarPulse {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          30% {
            opacity: 0.4;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>

      <div className="pulse-container" style={containerStyle}>
        <div className="pulse-wave" />
        <div className="image-center">
          <img src={imageSrc} alt={altText} />
        </div>
      </div>
    </div>
  );
};

export default BazaarPulse;