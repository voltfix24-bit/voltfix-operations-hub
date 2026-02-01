import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, X, Loader2 } from "lucide-react";

interface InviteTechnicianFormProps {
  onSuccess?: () => void;
}

const SKILL_OPTIONS = [
  "Algemeen",
  "Storingen",
  "Meterkast",
  "Laadpaal",
  "Verlichting",
  "Stopcontacten",
  "Domotica",
  "Bedrijfsinstallaties",
];

export function InviteTechnicianForm({ onSuccess }: InviteTechnicianFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    maxDailyJobs: "8",
    notes: "",
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Algemeen"]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      city: "",
      maxDailyJobs: "8",
      notes: "",
    });
    setSelectedSkills(["Algemeen"]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.fullName.trim() || !formData.email.trim()) {
        toast.error("Vul alle verplichte velden in");
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error("Ongeldig e-mailadres");
        setLoading(false);
        return;
      }

      // Generate a temporary password for the technician
      const tempPassword = crypto.randomUUID().slice(0, 16);

      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: tempPassword,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        if (authError.message.includes("already registered")) {
          toast.error("Dit e-mailadres is al geregistreerd");
        } else {
          toast.error(`Fout bij aanmaken account: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Fout bij aanmaken account");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        email: formData.email.trim(),
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        postal_code: formData.postalCode.trim() || null,
        city: formData.city.trim() || null,
      });

      if (profileError) {
        console.error("Profile error:", profileError);
        toast.error("Fout bij aanmaken profiel");
        setLoading(false);
        return;
      }

      // Get the profile ID
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      // Create technician record
      const { error: techError } = await supabase.from("technicians").insert({
        user_id: userId,
        profile_id: profileData?.id || null,
        is_available: true,
        skill_tags: selectedSkills,
        max_daily_jobs: parseInt(formData.maxDailyJobs) || 8,
      });

      if (techError) {
        console.error("Technician error:", techError);
        toast.error("Fout bij aanmaken monteur record");
        setLoading(false);
        return;
      }

      // Create user role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "technician",
      });

      if (roleError) {
        console.error("Role error:", roleError);
        // Non-critical, continue anyway
      }

      toast.success(
        `${formData.fullName} is uitgenodigd als elektricien. Ze ontvangen een bevestigingsmail.`
      );

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error inviting technician:", error);
      toast.error("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Elektricien uitnodigen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe elektricien uitnodigen</DialogTitle>
          <DialogDescription>
            Vul de gegevens in om een nieuwe elektricien toe te voegen aan het
            systeem. Ze ontvangen een e-mail om hun account te bevestigen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Volledige naam <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Jan Jansen"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                E-mailadres <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jan@voorbeeld.nl"
                value={formData.email}
                onChange={handleInputChange}
                required
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoonnummer</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="06 12345678"
              value={formData.phone}
              onChange={handleInputChange}
              maxLength={20}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              name="address"
              placeholder="Straatnaam 123"
              value={formData.address}
              onChange={handleInputChange}
              maxLength={200}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postcode</Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="1234AB"
                value={formData.postalCode}
                onChange={handleInputChange}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                name="city"
                placeholder="Amsterdam"
                value={formData.city}
                onChange={handleInputChange}
                maxLength={100}
              />
            </div>
          </div>

          {/* Work settings */}
          <div className="space-y-2">
            <Label htmlFor="maxDailyJobs">Max. opdrachten per dag</Label>
            <Input
              id="maxDailyJobs"
              name="maxDailyJobs"
              type="number"
              min="1"
              max="20"
              value={formData.maxDailyJobs}
              onChange={handleInputChange}
            />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Vaardigheden</Label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  {selectedSkills.includes(skill) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Interne notities</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Optionele notities over deze elektricien..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Uitnodigen
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
