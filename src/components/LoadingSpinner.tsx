import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md',
  className = ''
}) => {
  // Configurações de tamanho
  const sizeConfig = {
    sm: { width: "40", height: "40", logoClass: "w-[40px] h-[40px] mb-3" },
    md: { width: "60", height: "60", logoClass: "w-[60px] h-[60px] mb-4" },
    lg: { width: "77", height: "77", logoClass: "w-[77px] h-[77px] mb-6" }
  };

  const config = sizeConfig[size];

  // Logo SVG animada do CorpVox
  const AnimatedLogo = () => (
    <svg
      width={config.width}
      height={config.height}
      viewBox="0 0 78.18 121.17"
      xmlns="http://www.w3.org/2000/svg"
      className={`${config.logoClass} mx-auto drop-shadow-lg`}
    >
      <defs>
        <style>
          {`
            .cls-1 { fill: #764099; }
            .cls-2 { fill: #1d2227; }

            /* Animação dos três pontos - bounce vertical com opacidade */
            .dot-1 { animation: dot-bounce 0.8s ease-out infinite; }
            .dot-2 { animation: dot-bounce 0.8s ease-out infinite 0.2s; }
            .dot-3 { animation: dot-bounce 0.8s ease-out infinite 0.4s; }

            @keyframes dot-bounce {
              0%, 70%, 100% {
                transform: translateY(0px);
                opacity: 0.6;
              }
              35% {
                transform: translateY(-4px);
                opacity: 1;
              }
            }
          `}
        </style>
      </defs>

      <g>
        <g>
          {/* Três pontos animados */}
          <path
            className="cls-1 dot-1"
            d="M25.92,75.12c-2.34,0-4.24,1.9-4.24,4.24,0,1.12.45,2.2,1.24,3s1.87,1.24,3,1.24c1.12,0,2.2-.45,3-1.24.79-.79,1.24-1.87,1.24-3,0-2.34-1.9-4.24-4.24-4.24Z"
          />
          <path
            className="cls-1 dot-2"
            d="M40.09,75.12c-2.34,0-4.24,1.9-4.24,4.24,0,1.12.45,2.2,1.24,3,.79.79,1.87,1.24,3,1.24,1.12,0,2.2-.45,3-1.24.79-.79,1.24-1.87,1.24-3,0-2.34-1.9-4.24-4.24-4.24Z"
          />
          <path
            className="cls-1 dot-3"
            d="M54.26,75.12c-2.34,0-4.24,1.9-4.24,4.24,0,1.12.45,2.2,1.24,3s1.87,1.24,3,1.24c1.12,0,2.20-.45,3-1.24.79-.79,1.24-1.87,1.24-3,0-2.34-1.9-4.24-4.24-4.24Z"
          />
        </g>

        {/* Balão de chat */}
        <path
          className="cls-2 chat-bubble"
          d="M78.17,53.95v-3.26h-11.7s-56.17,0-56.17,0c-5.69,0-10.31,4.61-10.31,10.31v60.18l27.36-11.6,40.51.02c5.69,0,10.31-4.61,10.31-10.31v-45.34h0ZM66.48,92.03c0,3.3-2.74,5.98-6.12,5.98-.51,0-36.52,0-36.52,0l-12.14,4.81v-34.56c0-3.3,2.74-5.98,6.12-5.98h48.66v29.75Z"
        />

        {/* Parte superior */}
        <path
          className="cls-1 profile-top"
          d="M78.17,47.87v-8.83c-.01-10.43-4.07-20.23-11.45-27.61C59.34,4.06,49.54,0,39.11,0S18.88,4.06,11.5,11.44C4.15,18.79.09,28.65.07,39.04h0v14.64c2.19-4.52,6.07-5.91,11.18-5.81h.49v-8.74c0-15.09,12.28-27.45,27.37-27.45s27.37,12.28,27.37,27.37v8.83h11.69Z"
        />
      </g>
    </svg>
  );

  return (
    <div className={`text-center ${className}`}>
      <AnimatedLogo />

      {message && (
        <p className="text-gray-600 text-base font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
