
"use client";

import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Eraser, UploadCloud } from 'lucide-react';
import Image from 'next/image';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  initialSignature?: string | null;
}

// Helper to convert a file to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, initialSignature }) => {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [currentSignature, setCurrentSignature] = useState<string | null>(initialSignature || null);

  useEffect(() => {
    // This effect ensures that if the parent form is reset, the signature pad also visually resets.
    setCurrentSignature(initialSignature || null);
  }, [initialSignature]);

  const clear = () => {
    sigPadRef.current?.clear();
    setCurrentSignature(null);
    onSave(""); // Inform parent component that signature is cleared
  };

  const saveSignature = () => {
    if (sigPadRef.current) {
      const dataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
      setCurrentSignature(dataUrl);
      onSave(dataUrl);
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setCurrentSignature(base64);
      onSave(base64);
    }
  };

  return (
    <div className="space-y-4">
        {currentSignature ? (
             <div className="relative w-full h-48 border rounded-md flex items-center justify-center bg-gray-50">
                 <Image src={currentSignature} alt="Firma" layout="fill" objectFit="contain" />
                 <Button variant="destructive" size="sm" onClick={() => { setCurrentSignature(null); onSave(""); }} className="absolute top-2 right-2">
                     Cambiar Firma
                 </Button>
            </div>
        ) : (
             <Tabs defaultValue="draw">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="draw">Dibujar Firma</TabsTrigger>
                    <TabsTrigger value="upload">Subir Imagen</TabsTrigger>
                </TabsList>
                <TabsContent value="draw">
                    <div className="relative border rounded-md bg-background">
                    <SignatureCanvas
                        ref={sigPadRef}
                        penColor='black'
                        canvasProps={{ className: 'w-full h-40 rounded-md' }}
                        onEnd={saveSignature}
                    />
                    </div>
                    <div className="flex justify-end mt-2">
                        <Button type="button" variant="ghost" size="sm" onClick={clear}>
                            <Eraser className="mr-2 h-4 w-4" />
                            Limpiar
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="upload">
                     <div className="relative">
                        <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="file" accept="image/*" className="pl-10" onChange={handleFileUpload} />
                    </div>
                </TabsContent>
            </Tabs>
        )}

    </div>
  );
};

