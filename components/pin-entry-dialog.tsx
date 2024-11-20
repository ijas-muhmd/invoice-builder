"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"
import { Lock, Fingerprint, Scan } from "lucide-react"
import { PinInput } from "./pin-input"
import { toast } from "react-hot-toast"
import { isBiometricAvailable, registerBiometric, verifyBiometric } from "@/lib/webauthn"

interface PinEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (pin: string) => void
}

export function PinEntryDialog({ open, onOpenChange, onSubmit }: PinEntryDialogProps) {
  const [pin, setPin] = useState("")
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  // Check for biometric support and status
  const checkBiometric = useCallback(async () => {
    const available = await isBiometricAvailable();
    setBiometricSupported(available);
    const enabled = localStorage.getItem('biometric_credential') === 'enabled';
    setBiometricEnabled(enabled);
  }, []);

  useEffect(() => {
    if (open) {
      checkBiometric();
    }
  }, [open, checkBiometric]);

  const handleBiometricAuth = useCallback(async () => {
    try {
      const verified = await verifyBiometric();
      if (verified) {
        const storedPin = localStorage.getItem('preferences_pin');
        if (storedPin) {
          onSubmit(storedPin);
          onOpenChange(false);
        } else {
          toast.error("PIN not found. Please use manual PIN entry.");
        }
      } else {
        toast.error("Biometric authentication failed. Please try again or use your PIN.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Authentication error. Please use your PIN instead.");
    }
  }, [onSubmit, onOpenChange]);

  const handleSetupBiometric = useCallback(async () => {
    try {
      const registered = await registerBiometric();
      if (registered) {
        setBiometricEnabled(true);
        toast.success("Biometric Setup Complete");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not setup biometric authentication");
    }
  }, []);

  const handlePinSubmit = useCallback(() => {
    onSubmit(pin);
    setPin("");
  }, [pin, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
        <div className="grid grid-cols-2 min-h-[600px]">
          {/* Left Column - Quote and Branding */}
          <div className="bg-primary/5 p-14 flex flex-col justify-between">
            <div className="space-y-8">
              <Lock className="h-16 w-16 text-primary" />
              <div className="space-y-4 text-left">
                <blockquote className="text-2xl font-medium leading-relaxed">
                  "Security is not just a feature, it's a promise we make to protect your business data."
                </blockquote>
                <p className="text-sm text-muted-foreground">
                  Your data is encrypted and secure with us. We use industry-standard encryption to protect your sensitive information.
                </p>
              </div>
            </div>
            
            {/* Made with love section */}
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                <p>Made with ❤️ by Invoice Maker <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">FREE</span></p>
                <p className="text-xs mt-1">
                  <a 
                    href="https://invoicemakerfree.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    invoicemakerfree.com
                  </a>
                </p>
              </div>
              
              {/* Google Ad Space */}
              <div className="bg-muted rounded-lg p-4 h-32 flex items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <p>Advertisement</p>
                  <p className="text-xs mt-1">Your ad could be here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - PIN Entry */}
          <div className="p-14">
            <div className="h-full flex flex-col justify-center items-center max-w-sm mx-auto space-y-10">
              <div className="space-y-4 text-center w-full">
                <h2 className="text-2xl font-semibold">Welcome Back!</h2>
                <p className="text-sm text-muted-foreground">
                  Please enter your PIN to access the application
                </p>
              </div>

              <div className="space-y-8 w-full">
                <div className="space-y-4">
                  <PinInput
                    value={pin}
                    onChange={setPin}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter 4-digit PIN
                  </p>
                </div>

                <Button 
                  className="w-full"
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4}
                >
                  Unlock
                </Button>

                {biometricSupported && (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or unlock with
                        </span>
                      </div>
                    </div>

                    {biometricEnabled ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleBiometricAuth}
                        >
                          <Fingerprint className="w-4 h-4 mr-2" />
                          Touch ID
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleBiometricAuth}
                        >
                          <Scan className="w-4 h-4 mr-2" />
                          Face ID
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleSetupBiometric}
                      >
                        <Fingerprint className="w-4 h-4 mr-2" />
                        Setup Biometric Login
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Forgot your PIN? Reset it in the security settings.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 