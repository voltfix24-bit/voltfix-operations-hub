import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestBookingFormProps {
  serviceId: string;
  serviceName: string;
  bookingType: "emergency" | "planned";
  scheduledDate?: string | null;
  timeSlot?: string | null;
  basePrice: number;
  finalPrice: number;
  onSuccess: (jobId: string) => void;
  onBack: () => void;
}

export function GuestBookingForm({
  serviceId,
  serviceName,
  bookingType,
  scheduledDate,
  timeSlot,
  basePrice,
  finalPrice,
  onSuccess,
  onBack,
}: GuestBookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = "Naam is verplicht";
    if (!phone.trim()) newErrors.phone = "Telefoonnummer is verplicht";
    if (phone && !/^[0-9+\-\s()]{10,}$/.test(phone)) {
      newErrors.phone = "Ongeldig telefoonnummer";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Ongeldig e-mailadres";
    }
    if (!address.trim()) newErrors.address = "Adres is verplicht";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).slice(0, 5 - photos.length);
    setPhotos(prev => [...prev, ...newPhotos]);
    
    // Create preview URLs
    const urls = newPhotos.map(file => URL.createObjectURL(file));
    setPhotoUrls(prev => [...prev, ...urls]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `guest/${fileName}`;
      
      const { error } = await supabase.storage
        .from('job-photos')
        .upload(filePath, photo);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('job-photos')
          .getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
    }
    
    setUploading(false);
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      // Upload photos first
      const uploadedPhotoUrls = await uploadPhotos();
      
      // Create job - cast timeSlot to proper enum type
      const timeSlotEnum = timeSlot as "morning" | "afternoon" | "evening" | "night" | null;
      
      const { data, error } = await supabase.from("jobs").insert({
        service_type_id: serviceId,
        urgency: bookingType,
        status: "requested" as const,
        scheduled_date: scheduledDate || null,
        scheduled_time_slot: timeSlotEnum,
        address,
        city: city || null,
        postal_code: postalCode || null,
        description: description || null,
        guest_name: name,
        guest_email: email || null,
        guest_phone: phone,
        base_price: basePrice,
        final_price: finalPrice,
        photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : null,
        is_open_for_claim: true,
        price_breakdown: {
          base: basePrice,
          type: bookingType,
          timeSlot,
          final: finalPrice,
        },
      }).select('id').single();

      if (error) throw error;
      onSuccess(data.id);
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Details */}
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-lg">Uw gegevens</h3>
          
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jan Jansen"
              className={cn("h-11", errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoonnummer *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12345678"
              className={cn("h-11", errors.phone && "border-destructive")}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres (optioneel)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@voorbeeld.nl"
              className={cn("h-11", errors.email && "border-destructive")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-lg">Adres</h3>
          
          <div className="space-y-2">
            <Label htmlFor="address">Straat en huisnummer *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Hoofdstraat 123"
              className={cn("h-11", errors.address && "border-destructive")}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postcode</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="1234 AB"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Amsterdam"
                className="h-11"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Omschrijving van het probleem</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschrijf kort wat er aan de hand is..."
          rows={3}
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-3">
        <Label>Foto's (optioneel, max 5)</Label>
        
        <div className="flex flex-wrap gap-3">
          {photoUrls.map((url, index) => (
            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <Camera className="h-5 w-5 mb-1" />
              <span className="text-xs">Toevoegen</span>
            </button>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">
          Upload foto's van het probleem om de elektricien te helpen
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Terug
        </Button>
        <Button 
          type="submit" 
          disabled={submitting || uploading}
          className={cn(
            "flex-1",
            bookingType === "emergency" && "bg-emergency hover:bg-emergency/90"
          )}
        >
          {submitting || uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? "Uploaden..." : "Bezig..."}
            </>
          ) : (
            bookingType === "emergency" ? "Direct aanvragen" : "Aanvraag versturen"
          )}
        </Button>
      </div>
    </form>
  );
}
