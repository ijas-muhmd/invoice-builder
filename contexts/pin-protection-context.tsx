"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { PinEntryDialog } from "@/components/pin-entry-dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface PinProtectionContextType {
  isLocked: boolean
  lock: () => void
  unlock: () => void
  setPin: (pin: string) => void
  hasPin: boolean
}

const PinProtectionContext = createContext<PinProtectionContextType>({
  isLocked: true,
  lock: () => {},
  unlock: () => {},
  setPin: () => {},
  hasPin: false,
})

const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export function PinProtectionProvider({ children }: { children: React.ReactNode }) {
  const [preferences] = useLocalStorage('preferences', { pin: '', theme: 'system' })
  const [isLocked, setIsLocked] = useState(true)
  const [showPinDialog, setShowPinDialog] = useState(false)

  // Check session on mount
  useEffect(() => {
    const checkSession = () => {
      const session = localStorage.getItem('auth_session');
      if (session) {
        const { expiresAt } = JSON.parse(session);
        if (new Date().getTime() < expiresAt) {
          setIsLocked(false);
          return;
        }
        // Session expired, remove it
        localStorage.removeItem('auth_session');
      }

      // Show PIN dialog if PIN is set and no valid session exists
      if (preferences.pin) {
        setShowPinDialog(true);
      } else {
        setIsLocked(false);
      }
    };

    checkSession();
  }, [preferences.pin]);

  const createSession = () => {
    const expiresAt = new Date().getTime() + SESSION_DURATION;
    localStorage.setItem('auth_session', JSON.stringify({ expiresAt }));
  };

  const handlePinSubmit = (enteredPin: string) => {
    if (enteredPin === preferences.pin) {
      setIsLocked(false);
      setShowPinDialog(false);
      createSession(); // Create new session on successful PIN entry
    } else {
      // Show error message
      alert('Incorrect PIN');
    }
  };

  return (
    <PinProtectionContext.Provider
      value={{
        isLocked,
        lock: () => {
          setIsLocked(true);
          localStorage.removeItem('auth_session'); // Clear session on lock
        },
        unlock: () => {
          setIsLocked(false);
          createSession(); // Create new session on unlock
        },
        setPin: (pin: string) => {
          localStorage.setItem('preferences', JSON.stringify({ ...preferences, pin }));
          createSession(); // Create new session when setting PIN
        },
        hasPin: Boolean(preferences.pin),
      }}
    >
      <PinEntryDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSubmit={handlePinSubmit}
      />
      {!isLocked && children}
    </PinProtectionContext.Provider>
  )
}

export const usePinProtection = () => useContext(PinProtectionContext) 