import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Camera, X, Loader2, CheckCircle, AlertCircle, User, Phone, Mail, MapPin, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PriceBreakdown } from "./PriceBreakdownCard";
import { useAddressLookup } from "@/hooks/useAddressLookup";

interface BookingSuccessPayload {
  jobId: string;
  guestName: string;
  guestPhone: string;
  address: string;
  city?: string;
  postalCode?: string;
}

interface GuestBookingFormProps {
  serviceId: string;
  serviceName: string;
  bookingType: "emergency" | "planned";
  scheduledDate?: string | null;
  timeSlot?: string | null;
  basePrice: number;
  finalPrice: number;
  priceBreakdown: PriceBreakdown;
  onSuccess: (payload: BookingSuccessPayload) => void;
  onBack: () => void;
  emergencyDescription?: string;
  emergencyPhotos?: File[];
}

export function GuestBookingForm({
  serviceId,
  serviceName,
  bookingType,
  scheduledDate,
  timeSlot,
  basePrice,
  finalPrice,
  priceBreakdown,
  onSuccess,
  onBack,
  emergencyDescription = "",
  emergencyPhotos = [],
}: GuestBookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [houseNumberAddition, setHouseNumberAddition] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState(emergencyDescription);
  const [photos, setPhotos] = useState<File[]>(emergencyPhotos);
  const [photoUrls, setPhotoUrls] = useState<string[]>(emergencyPhotos.map(f => URL.createObjectURL(f)));
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-lookup address based on postal code and house number
  const { 
    street: lookupStreet, 
    city: lookupCity, 
    loading: addressLoading, 
    found: addressFound,
    error: addressError 
  } = useAddressLookup(postalCode, houseNumber);

  // Update street and city when lookup succeeds
  useEffect(() => {
    if (addressFound && lookupStreet) {
      setStreet(lookupStreet);
      setCity(lookupCity);
    }
  }, [addressFound, lookupStreet, lookupCity]);

  // Compute full address for submission
  const fullAddress = street 
    ? `${street} ${houseNumber}${houseNumberAddition ? ` ${houseNumberAddition}` : ""}`
    : "";

  const validateField = (field: string, value: string) => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Naam is verplicht";
        break;
      case "phone":
        if (!value.trim()) return "Telefoonnummer is verplicht";
        if (!/^[0-9+\-\s()]{10,}$/.test(value)) return "Ongeldig telefoonnummer";
        break;
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Ongeldig e-mailadres";
        break;
      case "postalCode":
        if (!value.trim()) return "Postcode is verplicht";
        if (!/^[1-9][0-9]{3}\s?[A-Za-z]{2}$/.test(value.replace(/\s/g, ""))) return "Ongeldige postcode";
        break;
      case "houseNumber":
        if (!value.trim()) return "Huisnummer is verplicht";
        break;
    }
    return "";
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    newErrors.name = validateField("name", name);
    newErrors.phone = validateField("phone", phone);
    newErrors.email = validateField("email", email);
    newErrors.postalCode = validateField("postalCode", postalCode);
    newErrors.houseNumber = validateField("houseNumber", houseNumber);
    
    // Check if address was found
    if (!fullAddress) {
      newErrors.address = "Voer een geldige postcode en huisnummer in";
    }
    
    // Filter out empty errors
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, v]) => v !== "")
    );
    
    setErrors(filteredErrors);
    setTouched({ name: true, phone: true, email: true, postalCode: true, houseNumber: true });
    return Object.keys(filteredErrors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).slice(0, 5 - photos.length);
    setPhotos(prev => [...prev, ...newPhotos]);
    
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
      const uploadedPhotoUrls = await uploadPhotos();
      
      const timeSlotEnum = timeSlot as "morning" | "afternoon" | "evening" | "night" | null;
      
      const storedBreakdown = {
        lines: priceBreakdown.lines.map(line => ({
          label: line.label,
          amount: line.amount,
          hint: line.hint || null,
        })),
        subtotal: priceBreakdown.subtotal,
        vat: priceBreakdown.vat,
        total: priceBreakdown.total,
        base: basePrice,
        type: bookingType,
        timeSlot: timeSlot || null,
      };
      
      const { data, error } = await supabase.from("jobs").insert([{
        service_type_id: serviceId,
        urgency: bookingType,
        status: "requested" as const,
        scheduled_date: scheduledDate || null,
        scheduled_time_slot: timeSlotEnum,
        address: fullAddress,
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
        price_breakdown: storedBreakdown,
      }]).select('id').single();

      if (error) throw error;
      
      onSuccess({
        jobId: data.id,
        guestName: name,
        guestPhone: phone,
        address: fullAddress,
        city: city || undefined,
        postalCode: postalCode || undefined,
      });
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = (field: string) => cn(
    "h-12 rounded-xl border-2 transition-all duration-200",
    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
    touched[field] && errors[field] 
      ? "border-destructive bg-destructive/5" 
      : touched[field] && !errors[field] && getFieldValue(field)
        ? "border-success/50 bg-success/5"
        : "border-border"
  );

  const getFieldValue = (field: string): string => {
    switch (field) {
      case "name": return name;
      case "phone": return phone;
      case "postalCode": return postalCode;
      case "houseNumber": return houseNumber;
      default: return "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Details Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg">Uw gegevens</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              Naam <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur("name", name)}
                placeholder="Jan Jansen"
                className={inputClasses("name")}
              />
              <AnimatePresence>
                {touched.name && !errors.name && name && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <CheckCircle className="h-5 w-5 text-success" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {touched.name && errors.name && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              Telefoonnummer <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur("phone", phone)}
                placeholder="06 12345678"
                className={cn(inputClasses("phone"), "pl-10")}
              />
              <AnimatePresence>
                {touched.phone && !errors.phone && phone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <CheckCircle className="h-5 w-5 text-success" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {touched.phone && errors.phone && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-1">
            E-mailadres <span className="text-muted-foreground text-xs">(optioneel)</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email", email)}
              placeholder="jan@voorbeeld.nl"
              className={cn(inputClasses("email"), "pl-10")}
            />
          </div>
          <AnimatePresence>
            {touched.email && errors.email && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-destructive flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Address Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg">Adres</h3>
        </div>
        
        {/* Postal Code + House Number Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="postalCode" className="flex items-center gap-1">
              Postcode <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                onBlur={() => handleBlur("postalCode", postalCode)}
                placeholder="1234 AB"
                className={inputClasses("postalCode")}
                maxLength={7}
              />
            </div>
            <AnimatePresence>
              {touched.postalCode && errors.postalCode && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.postalCode}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="houseNumber" className="flex items-center gap-1">
              Huisnr. <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="houseNumber"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                onBlur={() => handleBlur("houseNumber", houseNumber)}
                placeholder="123"
                className={inputClasses("houseNumber")}
              />
            </div>
            <AnimatePresence>
              {touched.houseNumber && errors.houseNumber && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.houseNumber}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="houseNumberAddition">Toev.</Label>
            <Input
              id="houseNumberAddition"
              value={houseNumberAddition}
              onChange={(e) => setHouseNumberAddition(e.target.value)}
              placeholder="A, bis"
              className="h-12 rounded-xl border-2"
            />
          </div>
        </div>

        {/* Auto-filled Street and City */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Straat en plaats
            {addressLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </Label>
          <div className="relative">
            <Input
              value={addressFound ? `${street}, ${city}` : ""}
              readOnly
              placeholder="Wordt automatisch ingevuld..."
              className={cn(
                "h-12 rounded-xl border-2 bg-muted/50",
                addressFound && "border-success/50 bg-success/5"
              )}
            />
            <AnimatePresence>
              {addressFound && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle className="h-5 w-5 text-success" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {addressError && postalCode && houseNumber && !addressLoading && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-muted-foreground flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {addressError} - controleer postcode en huisnummer
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Description Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg">Extra informatie</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Omschrijving van het probleem</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschrijf kort wat er aan de hand is..."
            rows={3}
            className="rounded-xl border-2 resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-3">
          <Label>Foto's (optioneel, max 5)</Label>
          
          <div className="flex flex-wrap gap-3">
            <AnimatePresence>
              {photoUrls.map((url, index) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-border"
                >
                  <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1.5 bg-background/90 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {photos.length < 5 && (
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Camera className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Toevoegen</span>
              </motion.button>
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
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 pt-4"
      >
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack} 
          className="flex-1 h-12 rounded-xl"
        >
          Terug
        </Button>
        <Button 
          type="submit" 
          disabled={submitting || uploading}
          className={cn(
            "flex-1 h-12 rounded-xl font-semibold",
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
      </motion.div>
    </form>
  );
}
