import { Trophy } from 'lucide-react';

export const Leaderboard = ({ id }) => {
  // Professional content colors - Teal
  const contentTheme = {
    primary: '#14B8A6', // Teal
    primaryLight: '#2DD4BF',
    text: '#F9FAFB',
    textMuted: '#D1D5DB',
    cardBg: '#14B8A6',
  };

  return (
    <section 
      id={id}
      className="relative min-h-screen w-full overflow-hidden bg-black text-white" 
      data-testid="leaderboard-section">
      
      {/* Cinematic vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,0.85)_100%)]" />

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 py-20 sm:px-12">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            {/* Left Card */}
            <div className="flex-1 flex flex-col items-center justify-center lg:items-start" data-testid="leaderboard-card-container">
              <div
                className="group relative w-full max-w-sm overflow-hidden rounded-3xl transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: contentTheme.cardBg,
                  boxShadow: '0 10px 40px rgba(20, 184, 166, 0.3)',
                }}
                data-testid="leaderboard-card"
              >
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center aspect-square">
                  {/* Icon */}
                  <div
                    className="transition-all duration-300 group-hover:scale-110"
                    style={{
                      color: '#ffffff',
                    }}
                  >
                    <Trophy className="h-20 w-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col" data-testid="leaderboard-content">
              <h2
                className="mb-12 font-sans text-4xl font-black tracking-tight sm:text-5xl"
                style={{
                  color: contentTheme.text,
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}
                data-testid="leaderboard-title"
              >
                Global Leaderboard
              </h2>

              <div className="space-y-6 mb-12 flex-1">
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="leaderboard-content-1"
                >
                  Compete with millions of players worldwide and climb the global rankings. Track your progress in real-time and see how you stack up against the best players across all game modes.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="leaderboard-content-2"
                >
                  Earn prestigious badges and exclusive rewards for reaching top positions. Monthly resets keep the competition fresh and give everyone a chance to prove their skills.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="leaderboard-content-3"
                >
                  Join regional and global tournaments with massive prize pools. Showcase your achievements and become a legend in the gaming community with permanent recognition.
                </p>
              </div>

              {/* Button Below Right Content */}
              <button
                type="button"
                className="w-full max-w-xs inline-flex items-center justify-center rounded-full px-8 py-3 font-sans text-sm font-semibold tracking-wide transition-all duration-300"
                style={{
                  backgroundColor: contentTheme.primary,
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(20, 184, 166, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primaryLight;
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(20, 184, 166, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primary;
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(20, 184, 166, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                data-testid="leaderboard-button"
              >
                View Rankings
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
