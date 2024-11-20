"use client"

import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { ImagePlus, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export function LogoUpload() {
  const { watch, setValue } = useFormContext()
  const logo = watch('logo')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setValue('logo', base64String, { 
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true 
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setValue('logo', '', { 
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true 
    })
  }

  if (!mounted) return null

  return (
    <div className="flex items-center gap-4">
      {logo ? (
        <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
          <Image
            src={logo}
            alt="Logo preview"
            fill
            className="object-contain"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
            onClick={handleRemoveLogo}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="w-32 h-32 flex flex-col items-center justify-center border border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
          <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Add logo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  )
} 