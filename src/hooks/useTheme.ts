import { useAppStore } from '../stores/appStore';
import { VenomTheme } from '../types';

export const predefinedThemes: VenomTheme[] = [
  {
    id: 'venom-dark',
    name: 'Venom Dark',
    background: '#1e1e1e',
    text: '#d4d4d4',
    accent: '#39FF14',
    description: 'High contrast dark mode with neon toxic green accent',
  },
  {
    id: 'oled',
    name: 'OLED Black',
    background: '#000000',
    text: '#f0f0f0',
    accent: '#39FF14',
    description: 'Pure pitch black for zero battery draw on OLED screens',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    background: '#282a36',
    text: '#f8f8f2',
    accent: '#ff79c6',
    description: 'Popular purple-pink gothic coding palette',
  },
  {
    id: 'nord',
    name: 'Nord',
    background: '#2e3440',
    text: '#eceff4',
    accent: '#88c0d0',
    description: 'Arctic, cool north-bluish elegant reading comfort',
  },
  {
    id: 'sepia',
    name: 'Sepia',
    background: '#f4ecd8',
    text: '#5b4636',
    accent: '#c86432',
    description: 'Warm paper tint designed to reduce blue-light strain',
  },
  {
    id: 'solarized',
    name: 'Solarized',
    background: '#002b36',
    text: '#839496',
    accent: '#b58900',
    description: 'Scientifically calibrated low-contrast solar dark palette',
  },
  {
    id: 'custom',
    name: 'Custom',
    background: '#121212',
    text: '#e0e0e0',
    accent: '#39FF14',
    description: 'Pick custom background, text, and accent colors',
  },
];

export const useTheme = () => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const applyTheme = (newTheme: VenomTheme) => {
    setTheme(newTheme);
  };

  const updateCustomTheme = (updates: Partial<VenomTheme>) => {
    if (theme.id === 'custom') {
      setTheme({ ...theme, ...updates });
    }
  };

  return {
    theme,
    applyTheme,
    updateCustomTheme,
    predefinedThemes,
  };
};
