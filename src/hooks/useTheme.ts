import { useAppStore } from '../stores/appStore';
import { VenomTheme } from '../types';

export const predefinedThemes: VenomTheme[] = [
  {
    id: 'dark-default',
    name: 'Venom Dark',
    background: '#1e1e1e',
    text: '#d4d4d4',
    accent: '#39FF14',
    description: 'Default high contrast dark mode'
  },
  {
    id: 'dracula',
    name: 'Dracula',
    background: '#282a36',
    text: '#f8f8f2',
    accent: '#ff79c6',
    description: 'A dark theme for Dracula lovers'
  },
  {
    id: 'nord',
    name: 'Nord',
    background: '#2e3440',
    text: '#eceff4',
    accent: '#88c0d0',
    description: 'Arctic, north-bluish clean and elegant'
  },
  {
    id: 'custom',
    name: 'Custom',
    background: '#000000',
    text: '#ffffff',
    accent: '#39FF14',
    description: 'Your own custom colors'
  }
];

export const useTheme = () => {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);

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
    predefinedThemes
  };
};
