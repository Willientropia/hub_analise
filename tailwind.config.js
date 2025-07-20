/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}",
    "./src/renderer/**/*.{html,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors customizados
        gray: {
          850: '#1f2937',
          950: '#0f172a'
        },
        // Cores para analytics
        analytics: {
          primary: '#3B82F6',
          secondary: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      transitionProperty: {
        'width': 'width',
        'spacing': 'margin, padding',
        'colors-transform': 'color, background-color, border-color, text-decoration-color, fill, stroke, transform',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-orange': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'inner-glow': 'inset 0 0 10px rgba(59, 130, 246, 0.3)',
        'soft': '0 2px 15px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 25px rgba(0, 0, 0, 0.15)',
        'hard': '0 8px 35px rgba(0, 0, 0, 0.2)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      lineHeight: {
        'extra-loose': '2.5',
        '12': '3rem',
      },
      letterSpacing: {
        'widest': '.25em',
      },
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '85': '0.85',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
      rotate: {
        '15': '15deg',
        '30': '30deg',
        '45': '45deg',
        '60': '60deg',
        '90': '90deg',
        '180': '180deg',
      },
      skew: {
        '15': '15deg',
        '30': '30deg',
      },
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
        '9/16': '9 / 16',
      },
      content: {
        'empty': '""',
      },
    },
  },
  plugins: [
    // Plugin personalizado para utilitários de performance
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        // GPU Acceleration
        '.gpu-accelerated': {
          'transform': 'translateZ(0)',
          'will-change': 'transform',
        },
        '.gpu-auto': {
          'will-change': 'auto',
        },
        
        // Smooth Scrolling
        '.smooth-scroll': {
          'scroll-behavior': 'smooth',
          '-webkit-overflow-scrolling': 'touch',
        },
        
        // Performance optimized transitions
        '.transition-performance': {
          'transition-property': 'color, background-color, border-color, box-shadow, transform, opacity',
          'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
          'transition-duration': '150ms',
        },
        
        // Hover effects
        '.hover-lift': {
          'transition': 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 8px 25px rgba(0, 0, 0, 0.15)',
          },
        },
        
        '.hover-glow': {
          'transition': 'box-shadow 0.2s ease',
          '&:hover': {
            'box-shadow': '0 0 20px rgba(59, 130, 246, 0.3)',
          },
        },
        
        // Focus states
        '.focus-ring': {
          '&:focus-visible': {
            'outline': 'none',
            'box-shadow': '0 0 0 2px #3B82F6',
          },
        },
        
        // Loading states
        '.loading-shimmer': {
          'background': 'linear-gradient(90deg, #374151 25%, #4B5563 50%, #374151 75%)',
          'background-size': '200% 100%',
          'animation': 'shimmer 1.5s infinite',
        },
        
        // Container optimizations
        '.contain-layout': {
          'contain': 'layout',
        },
        '.contain-style': {
          'contain': 'style',
        },
        '.contain-paint': {
          'contain': 'paint',
        },
        '.contain-strict': {
          'contain': 'strict',
        },
        
        // Scroll optimizations
        '.scroll-momentum': {
          '-webkit-overflow-scrolling': 'touch',
          'scroll-behavior': 'smooth',
        },
        
        '.scroll-snap-y': {
          'scroll-snap-type': 'y mandatory',
        },
        '.scroll-snap-start': {
          'scroll-snap-align': 'start',
        },
        '.scroll-snap-center': {
          'scroll-snap-align': 'center',
        },
        
        // Text optimizations
        '.text-rendering-optimized': {
          'text-rendering': 'optimizeSpeed',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        
        // Backdrop filters
        '.backdrop-blur-xs': {
          'backdrop-filter': 'blur(2px)',
        },
        '.backdrop-blur-light': {
          'backdrop-filter': 'blur(4px)',
        },
        
        // Animation utilities
        '.animate-float': {
          'animation': 'float 3s ease-in-out infinite',
        },
        '.animate-scale-in': {
          'animation': 'scaleIn 0.2s ease-out',
        },
        '.animate-slide-in-right': {
          'animation': 'slideInRight 0.3s ease-out',
        },
        '.animate-slide-in-left': {
          'animation': 'slideInLeft 0.3s ease-out',
        },
        
        // Performance utilities
        '.will-change-transform': {
          'will-change': 'transform',
        },
        '.will-change-opacity': {
          'will-change': 'opacity',
        },
        '.will-change-scroll': {
          'will-change': 'scroll-position',
        },
        '.will-change-auto': {
          'will-change': 'auto',
        },
        
        // Layout utilities
        '.aspect-4-3': {
          'aspect-ratio': '4 / 3',
        },
        '.aspect-3-2': {
          'aspect-ratio': '3 / 2',
        },
        '.aspect-2-3': {
          'aspect-ratio': '2 / 3',
        },
        '.aspect-9-16': {
          'aspect-ratio': '9 / 16',
        },
        
        // Custom scrollbars
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#6B7280 #374151',
          '&::-webkit-scrollbar': {
            'width': '8px',
            'height': '8px',
          },
          '&::-webkit-scrollbar-track': {
            'background': '#374151',
            'border-radius': '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            'background': '#6B7280',
            'border-radius': '4px',
            'transition': 'background-color 0.2s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            'background': '#9CA3AF',
          },
        },
        
        '.scrollbar-none': {
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            'display': 'none',
          },
        },
      }

      const newComponents = {
        // Card components
        '.card': {
          'background-color': theme('colors.gray.800'),
          'border': '1px solid ' + theme('colors.gray.700'),
          'border-radius': theme('borderRadius.lg'),
          'padding': theme('spacing.6'),
          'transition': 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
          'will-change': 'border-color, box-shadow, transform',
        },
        
        '.card-hover': {
          '&:hover': {
            'border-color': theme('colors.gray.600'),
            'box-shadow': '0 10px 25px rgba(0, 0, 0, 0.15)',
            'transform': 'translateY(-2px)',
          },
        },
        
        // Button components
        '.btn': {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': theme('spacing.2') + ' ' + theme('spacing.4'),
          'border-radius': theme('borderRadius.lg'),
          'font-weight': theme('fontWeight.medium'),
          'transition': 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
          'will-change': 'background-color, box-shadow, transform',
          'cursor': 'pointer',
          '&:focus-visible': {
            'outline': 'none',
            'box-shadow': '0 0 0 2px ' + theme('colors.blue.500'),
          },
          '&:hover': {
            'transform': 'translateY(-1px)',
          },
          '&:active': {
            'transform': 'translateY(0)',
          },
        },
        
        '.btn-primary': {
          'background-color': theme('colors.blue.600'),
          'color': theme('colors.white'),
          '&:hover': {
            'background-color': theme('colors.blue.700'),
          },
        },
        
        '.btn-secondary': {
          'background-color': theme('colors.gray.600'),
          'color': theme('colors.white'),
          '&:hover': {
            'background-color': theme('colors.gray.700'),
          },
        },
        
        // Input components
        '.input': {
          'width': '100%',
          'padding': theme('spacing.2') + ' ' + theme('spacing.3'),
          'background-color': theme('colors.gray.700'),
          'border': '1px solid ' + theme('colors.gray.600'),
          'border-radius': theme('borderRadius.lg'),
          'color': theme('colors.white'),
          'transition': 'border-color 0.15s ease, box-shadow 0.15s ease',
          '&::placeholder': {
            'color': theme('colors.gray.400'),
          },
          '&:focus': {
            'outline': 'none',
            'border-color': 'transparent',
            'box-shadow': '0 0 0 2px ' + theme('colors.blue.500'),
          },
        },
        
        // Table components
        '.table': {
          'width': '100%',
          'background-color': theme('colors.gray.800'),
          'border-radius': theme('borderRadius.lg'),
          'overflow': 'hidden',
          'border': '1px solid ' + theme('colors.gray.700'),
          'table-layout': 'fixed',
          'transform': 'translateZ(0)',
          'contain': 'layout style',
        },
        
        '.table thead': {
          'background-color': theme('colors.gray.700'),
          'position': 'sticky',
          'top': '0',
          'z-index': '10',
        },
        
        '.table th': {
          'padding': theme('spacing.3') + ' ' + theme('spacing.6'),
          'text-align': 'left',
          'font-size': theme('fontSize.xs'),
          'font-weight': theme('fontWeight.medium'),
          'color': theme('colors.gray.300'),
          'text-transform': 'uppercase',
          'letter-spacing': theme('letterSpacing.wider'),
          'cursor': 'pointer',
          'transition': 'background-color 0.15s ease',
          '&:hover': {
            'background-color': theme('colors.gray.600'),
          },
        },
        
        '.table td': {
          'padding': theme('spacing.4') + ' ' + theme('spacing.6'),
          'white-space': 'nowrap',
          'font-size': theme('fontSize.sm'),
          'color': theme('colors.gray.300'),
        },
        
        '.table tbody tr': {
          'border-bottom': '1px solid ' + theme('colors.gray.700'),
          'cursor': 'pointer',
          'transition': 'background-color 0.15s ease, transform 0.15s ease',
          '&:hover': {
            'background-color': theme('colors.gray.700'),
            'transform': 'translateX(2px)',
          },
        },
        
        // Modal components
        '.modal-backdrop': {
          'position': 'fixed',
          'inset': '0',
          'background-color': 'rgba(0, 0, 0, 0.5)',
          'backdrop-filter': 'blur(4px)',
          'z-index': '50',
          'will-change': 'opacity',
          'transition': 'opacity 0.2s ease',
        },
        
        '.modal-panel': {
          'position': 'relative',
          'background-color': theme('colors.gray.800'),
          'border-radius': theme('borderRadius.lg'),
          'border': '1px solid ' + theme('colors.gray.700'),
          'max-width': '56rem',
          'width': '100%',
          'max-height': '90vh',
          'overflow-y': 'auto',
          '-webkit-overflow-scrolling': 'touch',
          'will-change': 'transform, opacity',
          'transform': 'translateZ(0)',
          'transition': 'transform 0.2s ease, opacity 0.2s ease',
        },
      }

      // Adicionar keyframes para animações
      const keyframes = {
        '@keyframes shimmer': {
          '0%': {
            'background-position': '200% 0',
          },
          '100%': {
            'background-position': '-200% 0',
          },
        },
        '@keyframes float': {
          '0%, 100%': {
            'transform': 'translateY(0px)',
          },
          '50%': {
            'transform': 'translateY(-5px)',
          },
        },
        '@keyframes scaleIn': {
          '0%': {
            'transform': 'scale(0.95)',
            'opacity': '0',
          },
          '100%': {
            'transform': 'scale(1)',
            'opacity': '1',
          },
        },
        '@keyframes slideInRight': {
          '0%': {
            'transform': 'translateX(-20px)',
            'opacity': '0',
          },
          '100%': {
            'transform': 'translateX(0)',
            'opacity': '1',
          },
        },
        '@keyframes slideInLeft': {
          '0%': {
            'transform': 'translateX(20px)',
            'opacity': '0',
          },
          '100%': {
            'transform': 'translateX(0)',
            'opacity': '1',
          },
        },
      }

      addUtilities(newUtilities)
      addComponents(newComponents)
      addUtilities(keyframes)
    },
    
    // Plugin para variáveis CSS customizadas
    function({ addBase, theme }) {
      addBase({
        ':root': {
          '--color-primary': theme('colors.blue.600'),
          '--color-secondary': theme('colors.gray.600'),
          '--color-success': theme('colors.green.600'),
          '--color-warning': theme('colors.orange.600'),
          '--color-danger': theme('colors.red.600'),
          '--color-info': theme('colors.purple.600'),
          '--spacing-xs': theme('spacing.1'),
          '--spacing-sm': theme('spacing.2'),
          '--spacing-md': theme('spacing.4'),
          '--spacing-lg': theme('spacing.6'),
          '--spacing-xl': theme('spacing.8'),
          '--border-radius': theme('borderRadius.lg'),
          '--shadow-sm': theme('boxShadow.sm'),
          '--shadow-md': theme('boxShadow.md'),
          '--shadow-lg': theme('boxShadow.lg'),
          '--transition-fast': '150ms',
          '--transition-normal': '200ms',
          '--transition-slow': '300ms',
        },
      })
    },
  ],
  // Otimizações para build
  corePlugins: {
    // Desabilitar plugins não utilizados para reduzir tamanho do CSS
    // fontVariantNumeric: false,
  },
  // Configurações de produção
  ...(process.env.NODE_ENV === 'production' && {
    // Purge CSS não utilizado em produção
    purge: {
      enabled: true,
      content: [
        "./src/**/*.{html,js,jsx}",
        "./src/renderer/**/*.{html,js,jsx}"
      ],
      // Manter classes que podem ser geradas dinamicamente
      safelist: [
        'bg-red-500',
        'bg-green-500',
        'bg-blue-500',
        'bg-orange-500',
        'bg-purple-500',
        'text-red-400',
        'text-green-400',
        'text-blue-400',
        'text-orange-400',
        'text-purple-400',
        /^animate-/,
        /^transition-/,
        /^duration-/,
        /^ease-/,
      ],
    },
  }),
}