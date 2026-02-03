import { useState, useEffect } from "react";

interface AddressResult {
  street: string;
  city: string;
  municipality?: string;
}

interface UseAddressLookupResult {
  street: string;
  city: string;
  loading: boolean;
  error: string | null;
  found: boolean;
}

// Dutch postal code regex: 4 digits + optional space + 2 letters
const POSTAL_CODE_REGEX = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;

export function useAddressLookup(
  postalCode: string,
  houseNumber: string
): UseAddressLookupResult {
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);

  useEffect(() => {
    // Reset when inputs change
    setError(null);

    // Normalize postal code (remove spaces, uppercase)
    const normalizedPostalCode = postalCode.replace(/\s/g, "").toUpperCase();
    
    // Validate inputs
    if (!POSTAL_CODE_REGEX.test(normalizedPostalCode)) {
      setStreet("");
      setCity("");
      setFound(false);
      return;
    }

    const houseNum = parseInt(houseNumber, 10);
    if (isNaN(houseNum) || houseNum <= 0) {
      setStreet("");
      setCity("");
      setFound(false);
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        // Use PDOK Locatieserver - free Dutch government API
        const query = `${normalizedPostalCode} ${houseNumber}`;
        const response = await fetch(
          `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(query)}&fq=type:adres&rows=1`
        );

        if (!response.ok) {
          throw new Error("Adres lookup mislukt");
        }

        const data = await response.json();
        
        if (data.response?.docs?.length > 0) {
          const doc = data.response.docs[0];
          // Extract street name and city from the result
          const streetName = doc.straatnaam || "";
          const cityName = doc.woonplaatsnaam || "";
          
          setStreet(streetName);
          setCity(cityName);
          setFound(true);
        } else {
          setStreet("");
          setCity("");
          setFound(false);
          setError("Adres niet gevonden");
        }
      } catch (err) {
        console.error("Address lookup error:", err);
        setError("Kon adres niet ophalen");
        setFound(false);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [postalCode, houseNumber]);

  return { street, city, loading, error, found };
}
