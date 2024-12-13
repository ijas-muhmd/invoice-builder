"use client"

import { Input } from "@/components/ui/input"
import { useRef } from "react"

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export function PinInput({ value, onChange, maxLength = 4 }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Split value into array of single characters
  const pins = value.split('').concat(Array(maxLength - value.length).fill(''));

  const handleChange = (index: number, inputValue: string) => {
    const newValue = inputValue.slice(-1);
    const newPins = [...pins];
    newPins[index] = newValue;
    onChange(newPins.join(''));

    // Move to next input if value is entered
    if (newValue && index < maxLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, maxLength);
    onChange(pastedData);
  };

  return (
    <div className="flex gap-3 justify-center">
      {pins.map((pin, index) => (
        <Input
          key={index}
          ref={el => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          value={pin}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-14 h-14 text-center text-2xl"
          maxLength={1}
        />
      ))}
    </div>
  );
} 