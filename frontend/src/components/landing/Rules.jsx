import { BookOpen } from 'lucide-react';

export const Rules = ({ id }) => {
  // Professional content colors
  const contentTheme = {
    primary: '#10B981', // Green
    primaryLight: '#34D399',
    text: '#F9FAFB',
    textMuted: '#D1D5DB',
    cardBg: '#10B981',
  };

  return (
    <section 
      id={id}
      className="relative min-h-screen w-full overflow-hidden bg-black text-white" 
      data-testid="rules-section">
      
      {/* Cinematic vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,0.85)_100%)]" />

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 py-20 sm:px-12">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            {/* Left Card */}
            <div className="flex-1 flex flex-col items-center justify-center lg:items-start" data-testid="rules-card-container">
              <div
                className="group relative w-full max-w-sm overflow-hidden rounded-3xl transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: contentTheme.cardBg,
                  boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
                }}
                data-testid="rules-card"
              >
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center aspect-square">
                  {/* Icon */}
                  <div
                    className="transition-all duration-300 group-hover:scale-110"
                    style={{
                      color: '#ffffff',
                    }}
                  >
                    <BookOpen className="h-20 w-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col" data-testid="rules-content">
              <h2
                className="mb-12 font-sans text-4xl font-black tracking-tight sm:text-5xl"
                style={{
                  color: contentTheme.text,
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}
                data-testid="rules-title"
              >
                Rules & Guidelines
              </h2>

              <div className="space-y-6 mb-12 flex-1">
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="rules-content-1"
                >
                  Welcome to our gaming platform. These rules ensure a fair and enjoyable experience for all players. Please read them carefully before participating in any games or competitions.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="rules-content-2"
                >
                  All players must maintain respectful behavior at all times. Harassment, cheating, or any form of misconduct will result in immediate suspension from the platform.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="rules-content-3"
                >
                  Fair play is essential. Any attempt to manipulate game mechanics or exploit bugs will be investigated and penalized accordingly. Report any issues to our support team immediately.
                </p>
              </div>

              {/* Button Below Right Content */}
              <button
                type="button"
                className="w-full max-w-xs inline-flex items-center justify-center rounded-full px-8 py-3 font-sans text-sm font-semibold tracking-wide transition-all duration-300"
                style={{
                  backgroundColor: contentTheme.primary,
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primaryLight;
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primary;
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                data-testid="rules-visit-button"
              >
                Visit Rules
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
