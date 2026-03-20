import { useState, useEffect } from 'react';
import { audioManager } from '../utils/audioManager';

/**
 * Hook customizado para lidar com a política de Autoplay.
 * Ele escuta magicamente pelo primeiro clique (ou toque) na página,
 * e assim que acontece, ele "libera" o audioManager.
 * 
 * Retorna se o áudio está liberado (isUnlocked) para que você possa
 * exibir um botão de aviso caso queira.
 */
export function useAudioUnlock() {
  const [isUnlocked, setIsUnlocked] = useState(audioManager.isUnlocked);

  useEffect(() => {
    // Função local para tentar o desbloqueio
    const handleInteraction = async () => {
      if (audioManager.isUnlocked) return;
      
      const success = await audioManager.unlock();
      if (success) {
        setIsUnlocked(true);
        // Desbloqueou com sucesso? Então removemos os listeners pra não gastar memória
        removeListeners();
      }
    };

    const removeListeners = () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    // Só anexa os eventos se ainda não estiver desbloqueado
    if (!audioManager.isUnlocked) {
      document.addEventListener('click', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
      
      // Checa se o contexto já nasceu rodando por acaso do destino (ou permissões cacheadas)
      if (audioManager.context && audioManager.context.state === 'running') {
        audioManager.isUnlocked = true;
        setIsUnlocked(true);
        removeListeners();
      }
    } else {
      setIsUnlocked(true);
    }

    return () => {
      removeListeners();
    };
  }, []);

  return { 
    isUnlocked,
    // Caso queira atrelar isso manualmente num botão onClick={() => unlockManual()}
    unlockManual: async () => {
      const success = await audioManager.unlock();
      if (success) setIsUnlocked(true);
    }
  };
}
