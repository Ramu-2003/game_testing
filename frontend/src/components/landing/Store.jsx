import { ShoppingBag } from 'lucide-react';

export const Store = ({ id }) => {
  // Store theme colors - Unique Orange/Amber color
  const contentTheme = {
    primary: '#F97316', // Orange
    primaryLight: '#FB923C',
    text: '#F9FAFB',
    textMuted: '#D1D5DB',
    cardBg: '#F97316',
  };

  return (
    <section 
      id={id}
      className="relative min-h-screen w-full overflow-hidden bg-black text-white" 
      data-testid="store-section">
      
      {/* Cinematic vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,0.85)_100%)]" />

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 py-20 sm:px-12">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            {/* Left Content */}
            <div className="flex-1 flex flex-col" data-testid="store-content">
              <h2
                className="mb-12 font-sans text-4xl font-black tracking-tight sm:text-5xl"
                style={{
                  color: contentTheme.text,
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}
                data-testid="store-title"
              >
                Game Store
              </h2>

              <div className="space-y-6 mb-12 flex-1">
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="store-content-1"
                >
                  Unlock exclusive items, power-ups, and customization options to enhance your gaming experience. Browse through our curated collection of premium content designed to give you the edge in every challenge.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="store-content-2"
                >
                  Earn in-game currency through victories and achievements, or purchase premium currency to instantly access rare items. Every purchase supports ongoing development and new content updates.
                </p>
                <p 
                  className="text-base leading-relaxed font-sans" 
                  style={{ color: contentTheme.textMuted }}
                  data-testid="store-content-3"
                >
                  Limited-time offers and seasonal items refresh regularly. Check back often to discover new additions and exclusive deals available only in the Game Store.
                </p>
              </div>

              {/* Button Below Left Content */}
              <button
                type="button"
                className="w-full max-w-xs inline-flex items-center justify-center rounded-full px-8 py-3 font-sans text-sm font-semibold tracking-wide transition-all duration-300"
                style={{
                  backgroundColor: contentTheme.primary,
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primaryLight;
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(249, 115, 22, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = contentTheme.primary;
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                data-testid="store-button"
              >
                Browse Store
              </button>
            </div>

            {/* Right Card */}
            <div className="flex-1 flex flex-col items-center justify-center lg:items-end" data-testid="store-card-container">
              <div
                className="group relative w-full max-w-sm overflow-hidden rounded-3xl transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: contentTheme.cardBg,
                  boxShadow: '0 10px 40px rgba(249, 115, 22, 0.3)',
                }}
                data-testid="store-card"
              >
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center aspect-square">
                  {/* Icon */}
                  <div
                    className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      color: '#ffffff',
                    }}
                  >
                    <ShoppingBag className="h-20 w-20" strokeWidth={2.5} />
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
