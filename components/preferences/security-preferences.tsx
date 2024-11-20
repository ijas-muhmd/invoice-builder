"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { usePinProtection } from "@/contexts/pin-protection-context"
import { toast } from "@/components/ui/use-toast"
import { Card } from "@/components/ui/card"
import { Fingerprint, Scan } from "lucide-react"
import { registerBiometric, isBiometricAvailable } from "@/lib/webauthn"
import { useEffect } from "react"

export function SecurityPreferences() {
  const { hasPin, setPin } = usePinProtection()
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  useEffect(() => {
    // Check biometric support and status
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      setBiometricSupported(available);
      const enabled = localStorage.getItem('biometric_credential') === 'enabled';
      setBiometricEnabled(enabled);
    };
    checkBiometric();
  }, []);

  const handleSetPin = () => {
    if (newPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits",
        variant: "destructive"
      })
      return
    }

    if (newPin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "Please make sure your PINs match",
        variant: "destructive"
      })
      return
    }

    setPin(newPin)
    localStorage.setItem('preferences_pin', newPin);
    toast({
      title: "PIN set successfully",
      description: "Your app is now protected with a PIN",
    })
    setNewPin("")
    setConfirmPin("")
  }

  const handleSetupBiometric = async () => {
    try {
      if (!hasPin) {
        toast({
          title: "Set PIN first",
          description: "You need to set a PIN before enabling biometric login",
          variant: "destructive"
        });
        return;
      }

      const registered = await registerBiometric();
      if (registered) {
        setBiometricEnabled(true);
        toast({
          title: "Biometric Setup Complete",
          description: "You can now use biometric authentication",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Setup Failed",
        description: "Could not setup biometric authentication",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* PIN Setup */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">PIN Protection</h3>
            <p className="text-sm text-muted-foreground">
              Set a 4-digit PIN to protect your data
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter new PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={4}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength={4}
              />
            </div>
            <Button onClick={handleSetPin}>
              {hasPin ? "Update PIN" : "Set PIN"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Biometric Setup */}
      {biometricSupported && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Biometric Login</h3>
              <p className="text-sm text-muted-foreground">
                Enable Face ID or Touch ID for quick access
              </p>
            </div>

            <div className="space-y-4">
              {biometricEnabled ? (
                <div className="flex gap-4">
                  <Button variant="outline" className="w-full" disabled>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Touch ID Enabled
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <Scan className="w-4 h-4 mr-2" />
                    Face ID Enabled
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSetupBiometric}
                  disabled={!hasPin}
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Setup Biometric Login
                </Button>
              )}
              {!hasPin && (
                <p className="text-xs text-muted-foreground text-center">
                  Set a PIN first to enable biometric login
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 