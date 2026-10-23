import { User } from 'lucide-react';

export const Profile = ({ id }) => {
  // Professional content colors - Indigo
  const contentTheme = {
    primary: '#6366F1', // Indigo
    primaryLight: '#818CF8',
    text: '#F9FAFB',
    textMuted: '#D1D5DB',
    cardBg: '#6366F1',
  };

  return (
    <section 
      id={id}
      className="relative min-h-screen w-full overflow-hidden bg-black text-white" 
      data-testid="profile-section">
      
      {/* Cinematic vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,0.85)_100%)]" />

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 py-20 sm:px-12">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            {/* Left Content */}
            <div className="flex-1 flex flex-col" data-testid="profile-content">
              <h2
                className="mb-12 font-sans text-4xl font-black tracking-tight sm:text-5xl"
                style={{
                  color: contentTheme.text,
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}
                data-testid="profile-title"
              >
                Your Profile
              </h2>

              <div className="space-y-6 mb-12 flex-1">
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="profile-content-1"
                >
                  Customize your gaming profile and showcase your achievements to the community. Upload your avatar, set your status, and display your favorite game modes and accomplishments.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="profile-content-2"
                >
                  Track your personal statistics, view your match history, and analyze your performance across all game modes. Monitor your progress and identify areas for improvement.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="profile-content-3"
                >
                  Connect with friends, join clans, and participate in team competitions. Build your gaming network and collaborate with other players to achieve greater success.
                </p>
              </div>

              {/* Button Below Left Content */}
              <button
                type="button"
                className="w-full max-w-xs inline-flex items-center justify-center rounded-full px-8 py-3 font-sans text-sm font-semibold tracking-wide transition-all duration-300"
                style={{
                  backgroundColor: contentTheme.primary,
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primaryLight;
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primary;
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                data-testid="profile-button"
              >
                Edit Profile
              </button>
            </div>

            {/* Right Card */}
            <div className="flex-1 flex flex-col items-center justify-center lg:items-end" data-testid="profile-card-container">
              <div
                className="group relative w-full max-w-sm overflow-hidden rounded-3xl transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: contentTheme.cardBg,
                  boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)',
                }}
                data-testid="profile-card"
              >
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center aspect-square">
                  {/* Icon */}
                  <div
                    className="transition-all duration-300 group-hover:scale-110"
                    style={{
                      color: '#ffffff',
                    }}
                  >
                    <User className="h-20 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
