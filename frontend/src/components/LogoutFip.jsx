export default function LogoutFip({ isLoading }) {
  // Si le chargement n'est pas actif, on n'affiche rien
  if (!isLoading) return null;

  return (
    <div className="logoutfip-overlay">
      {/* Injection des styles et keyframes CSS uniques au composant */}
      <style>{`
        .logoutfip-overlay {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: #F9F9F7;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .logoutfip-wrapper {
          position: relative;
          width: 100%;
          max-width: 400px;
          height: 200px;
        }

        .l-speeder {
          position: absolute;
          top: 50%;
          margin-left: -50px;
          left: 50%;
          animation: l-speeder-anim 0.4s linear infinite;
        }

        .l-speeder > span {
          height: 5px;
          width: 35px;
          background: #000;
          position: absolute;
          top: -19px;
          left: 60px;
          border-radius: 2px 10px 1px 0;
        }

        .l-base span {
          position: absolute;
          width: 0;
          height: 0;
          border-top: 6px solid transparent;
          border-right: 100px solid #000;
          border-bottom: 6px solid transparent;
        }

        .l-base span:before {
          content: "";
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: #000;
          position: absolute;
          right: -110px;
          top: -16px;
        }

        .l-base span:after {
          content: "";
          position: absolute;
          width: 0;
          height: 0;
          border-top: 0 solid transparent;
          border-right: 55px solid #000;
          border-bottom: 16px solid transparent;
          top: -16px;
          right: -98px;
        }

        .l-face {
          position: absolute;
          height: 12px;
          width: 20px;
          background: #000;
          border-radius: 20px 20px 0 0;
          transform: rotate(-40deg);
          right: -125px;
          top: -15px;
        }

        .l-face:after {
          content: "";
          height: 12px;
          width: 12px;
          background: #000;
          right: 4px;
          top: 7px;
          position: absolute;
          transform: rotate(40deg);
          transform-origin: 50% 50%;
          border-radius: 0 0 0 2px;
        }

        .l-speeder > span > span:nth-child(1),
        .l-speeder > span > span:nth-child(2),
        .l-speeder > span > span:nth-child(3),
        .l-speeder > span > span:nth-child(4) {
          width: 30px;
          height: 1px;
          background: #000;
          position: absolute;
          animation: l-fazer1 0.2s linear infinite;
        }

        .l-speeder > span > span:nth-child(2) {
          top: 3px;
          animation: l-fazer2 0.4s linear infinite;
        }

        .l-speeder > span > span:nth-child(3) {
          top: 1px;
          animation: l-fazer3 0.4s linear infinite;
          animation-delay: -1s;
        }

        .l-speeder > span > span:nth-child(4) {
          top: 4px;
          animation: l-fazer4 1s linear infinite;
          animation-delay: -1s;
        }

        .l-longfazers {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .l-longfazers span {
          position: absolute;
          height: 2px;
          width: 20%;
          background: #000;
        }

        .l-longfazers span:nth-child(1) {
          top: 20%;
          animation: l-lf 0.6s linear infinite;
          animation-delay: -5s;
        }

        .l-longfazers span:nth-child(2) {
          top: 40%;
          animation: l-lf2 0.8s linear infinite;
          animation-delay: -1s;
        }

        .l-longfazers span:nth-child(3) {
          top: 60%;
          animation: l-lf3 0.6s linear infinite;
        }

        .l-longfazers span:nth-child(4) {
          top: 80%;
          animation: l-lf4 0.5s linear infinite;
          animation-delay: -3s;
        }

        .logoutfip-text {
          margin-top: 20px;
          font-family: sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: #57534e;
          font-weight: 600;
          animation: l-pulse 1.5s ease-in-out infinite;
        }

        @keyframes l-fazer1 {
          0% { left: 0; }
          100% { left: -80px; opacity: 0; }
        }
        @keyframes l-fazer2 {
          0% { left: 0; }
          100% { left: -100px; opacity: 0; }
        }
        @keyframes l-fazer3 {
          0% { left: 0; }
          100% { left: -50px; opacity: 0; }
        }
        @keyframes l-fazer4 {
          0% { left: 0; }
          100% { left: -150px; opacity: 0; }
        }

        @keyframes l-speeder-anim {
          0% { transform: translate(2px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -3px) rotate(-1deg); }
          20% { transform: translate(-2px, 0px) rotate(1deg); }
          30% { transform: translate(1px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 3px) rotate(-1deg); }
          60% { transform: translate(-1px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-2px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 1px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }

        @keyframes l-lf {
          0% { left: 200%; }
          100% { left: -200%; opacity: 0; }
        }
        @keyframes l-lf2 {
          0% { left: 200%; }
          100% { left: -200%; opacity: 0; }
        }
        @keyframes l-lf3 {
          0% { left: 200%; }
          100% { left: -100%; opacity: 0; }
        }
        @keyframes l-lf4 {
          0% { left: 200%; }
          100% { left: -100%; opacity: 0; }
        }
        @keyframes l-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="logoutfip-wrapper">
        <div className="l-speeder">
          <span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
          <div className="l-base">
            <span></span>
            <div className="l-face"></div>
          </div>
        </div>

        <div className="l-longfazers">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className="logoutfip-text">Déconnexion en cours...</div>
    </div>
  );
}