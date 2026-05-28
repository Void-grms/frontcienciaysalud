import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', lg: '2rem' },
      screens: {
        '2xl': '1480px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Sombras propias: blur amplio + offset minimo. Da depth sin sentirse pesado.
        xs: '0 1px 2px 0 hsl(220 43% 11% / 0.04)',
        sm: '0 1px 2px 0 hsl(220 43% 11% / 0.05), 0 1px 3px 0 hsl(220 43% 11% / 0.05)',
        DEFAULT: '0 2px 4px -1px hsl(220 43% 11% / 0.06), 0 2px 8px -1px hsl(220 43% 11% / 0.04)',
        md: '0 4px 6px -1px hsl(220 43% 11% / 0.07), 0 2px 4px -2px hsl(220 43% 11% / 0.06)',
        lg: '0 10px 15px -3px hsl(220 43% 11% / 0.08), 0 4px 6px -4px hsl(220 43% 11% / 0.06)',
        // Focus ring fuerte para accesibilidad (>= 3:1).
        ring: '0 0 0 3px hsl(var(--ring) / 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(2px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'mesh-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        // Pop usado por la mascota cuando hay login exitoso (mini "bounce").
        'mascot-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.15) rotate(-4deg)' },
          '70%': { transform: 'scale(0.95) rotate(3deg)' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
        // Flotacion lenta para decoraciones de fondo (frascos / ADN / etc.).
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 400ms ease-out both',
        'mesh-spin': 'mesh-spin 22s linear infinite',
        'mascot-pop': 'mascot-pop 500ms ease-out',
        'float-slow': 'float-slow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
