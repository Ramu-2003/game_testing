import { Gift } from 'lucide-react';

export const Specials = ({ id }) => {
  // Professional content colors
  const contentTheme = {
    primary: '#F59E0B', // Amber/Orange
    primaryLight: '#FBBF24',
    text: '#F9FAFB',
    textMuted: '#D1D5DB',
    cardBg: '#F59E0B',
  };

  return (
    <section 
      id={id}
      className="relative min-h-screen w-full overflow-hidden bg-black text-white" 
      data-testid="specials-section">
      
      {/* Cinematic vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,0.85)_100%)]" />

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 py-20 sm:px-12">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            {/* Left Card */}
            <div className="flex-1 flex flex-col items-center justify-center lg:items-start" data-testid="specials-card-container">
              <div
                className="group relative w-full max-w-sm overflow-hidden rounded-3xl transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: contentTheme.cardBg,
                  boxShadow: '0 10px 40px rgba(245, 158, 11, 0.3)',
                }}
                data-testid="specials-card"
              >
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center aspect-square">
                  {/* Icon */}
                  <div
                    className="transition-all duration-300 group-hover:scale-110"
                    style={{
                      color: '#ffffff',
                    }}
                  >
                    <Gift className="h-20 w-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col" data-testid="specials-content">
              <h2
                className="mb-12 font-sans text-4xl font-black tracking-tight sm:text-5xl"
                style={{
                  color: contentTheme.text,
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}
                data-testid="specials-title"
              >
                Special Events
              </h2>

              <div className="space-y-6 mb-12 flex-1">
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="specials-content-1"
                >
                  Participate in exclusive special events and limited-time tournaments. Earn rare rewards, exclusive cosmetics, and prestigious titles that showcase your achievements to the community.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="specials-content-2"
                >
                  Join seasonal competitions with massive prize pools and global recognition. Compete against the best players worldwide and prove your skills on the international stage.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="specials-content-3"
                >
                  Unlock special event passes to access exclusive content, early access to new features, and VIP benefits. Limited slots available for each event, so register early to secure your spot.
                </p>
              </div>

              {/* Button Below Right Content */}
              <button
                type="button"
                className="w-full max-w-xs inline-flex items-center justify-center rounded-full px-8 py-3 font-sans text-sm font-semibold tracking-wide transition-all duration-300"
                style={{
                  backgroundColor: contentTheme.primary,
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primaryLight;
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(245, 158, 11, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primary;
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                data-testid="specials-button"
              >
                View Events
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
