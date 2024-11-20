export async function registerBiometric() {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    // Create challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Create credential options
    const createCredentialOptions: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: 'Invoice Maker FREE',
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from('DEFAULT_USER', c => c.charCodeAt(0)),
          name: 'default_user',
          displayName: 'Default User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    };

    // Create credential
    const credential = await navigator.credentials.create(createCredentialOptions);
    
    if (credential) {
      // Store credential ID in localStorage
      localStorage.setItem('biometric_credential', 'enabled');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error registering biometric:', error);
    return false;
  }
}

export async function verifyBiometric(): Promise<boolean> {
  try {
    // Check if biometric is enabled
    const isEnabled = localStorage.getItem('biometric_credential') === 'enabled';
    if (!isEnabled) {
      return false;
    }

    // Create challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Create assertion options
    const assertionOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
      },
    };

    // Get credential
    const assertion = await navigator.credentials.get(assertionOptions);
    return !!assertion;
  } catch (error) {
    console.error('Error verifying biometric:', error);
    return false;
  }
}

export function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return Promise.resolve(false);
  }
  
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
} 