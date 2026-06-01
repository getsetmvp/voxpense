import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type Toast = { id: number; text: string; kind: 'info' | 'good' | 'bad' };

type Ctx = {
  show: (text: string, kind?: Toast['kind']) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const { tokens } = useTheme();

  const show = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 100,
          gap: 8,
          alignItems: 'center',
        }}
      >
        {items.map((t) => (
          <View
            key={t.id}
            style={{
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor:
                t.kind === 'bad' ? tokens.bad : t.kind === 'good' ? tokens.good : tokens.ink,
              maxWidth: 360,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{t.text}</Text>
          </View>
        ))}
      </View>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const v = useContext(ToastCtx);
  if (!v) throw new Error('useToast outside ToastProvider');
  return v;
}
