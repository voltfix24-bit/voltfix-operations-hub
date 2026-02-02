import { useEffect } from "react";

// VoltFix Business Information
const VOLTFIX_BUSINESS = {
  name: "VoltFix",
  legalName: "VoltFix Elektrotechniek B.V.",
  description: "Professionele elektricien service in Nederland. 24/7 storingsdienst, meterkast keuringen, laadpaal installatie en meer. Transparante prijzen, gecertificeerde monteurs.",
  url: "https://voltfix.nl",
  telephone: "+31201234567",
  email: "info@voltfix.nl",
  address: {
    streetAddress: "Elektriciteitstraat 1",
    addressLocality: "Amsterdam",
    postalCode: "1000 AA",
    addressCountry: "NL",
  },
  geo: {
    latitude: 52.3676,
    longitude: 4.9041,
  },
  openingHours: [
    "Mo-Fr 08:00-18:00",
    "Sa-Su 00:00-23:59", // 24/7 emergency
  ],
  priceRange: "€€",
  areaServed: ["Nederland", "Amsterdam", "Rotterdam", "Den Haag", "Utrecht"],
  services: [
    { name: "Storingsdienst 24/7", price: "vanaf €95" },
    { name: "Meterkast keuring", price: "vanaf €95" },
    { name: "Laadpaal installatie", price: "vanaf €250" },
    { name: "Verlichting installatie", price: "vanaf €75" },
    { name: "Stopcontact plaatsen", price: "vanaf €85" },
  ],
};

interface StructuredDataProps {
  type: "LocalBusiness" | "Service" | "FAQPage" | "BreadcrumbList";
  data?: Record<string, unknown>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = `structured-data-${type}`;
    
    // Remove existing script
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    // Create new script
    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(getStructuredData(type, data));
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [type, data]);

  return null;
}

function getStructuredData(type: string, data?: Record<string, unknown>) {
  switch (type) {
    case "LocalBusiness":
      return {
        "@context": "https://schema.org",
        "@type": "Electrician",
        "@id": VOLTFIX_BUSINESS.url,
        name: VOLTFIX_BUSINESS.name,
        legalName: VOLTFIX_BUSINESS.legalName,
        description: VOLTFIX_BUSINESS.description,
        url: VOLTFIX_BUSINESS.url,
        telephone: VOLTFIX_BUSINESS.telephone,
        email: VOLTFIX_BUSINESS.email,
        address: {
          "@type": "PostalAddress",
          ...VOLTFIX_BUSINESS.address,
        },
        geo: {
          "@type": "GeoCoordinates",
          ...VOLTFIX_BUSINESS.geo,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "08:00",
            closes: "18:00",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Saturday", "Sunday"],
            opens: "00:00",
            closes: "23:59",
            description: "24/7 storingsdienst",
          },
        ],
        priceRange: VOLTFIX_BUSINESS.priceRange,
        areaServed: VOLTFIX_BUSINESS.areaServed.map((area) => ({
          "@type": "City",
          name: area,
        })),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Elektricien diensten",
          itemListElement: VOLTFIX_BUSINESS.services.map((service, index) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: service.name,
            },
            priceSpecification: {
              "@type": "PriceSpecification",
              price: service.price,
              priceCurrency: "EUR",
            },
            position: index + 1,
          })),
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "127",
          bestRating: "5",
        },
        sameAs: [
          "https://www.facebook.com/voltfix",
          "https://www.instagram.com/voltfix",
          "https://www.linkedin.com/company/voltfix",
        ],
        ...data,
      };

    case "Service":
      return {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Elektricien",
        provider: {
          "@type": "Electrician",
          name: VOLTFIX_BUSINESS.name,
          url: VOLTFIX_BUSINESS.url,
        },
        areaServed: {
          "@type": "Country",
          name: "Nederland",
        },
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: `${VOLTFIX_BUSINESS.url}/book`,
          servicePhone: VOLTFIX_BUSINESS.telephone,
          availableLanguage: ["nl", "en"],
        },
        ...data,
      };

    case "FAQPage":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Wat kost een elektricien van VoltFix?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Onze tarieven beginnen vanaf €75 voor eenvoudige werkzaamheden. Spoeddiensten starten vanaf €95. Je ziet altijd vooraf de volledige prijsopbouw inclusief BTW.",
            },
          },
          {
            "@type": "Question",
            name: "Hoe snel kan VoltFix er zijn bij een storing?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Bij spoed zijn we gemiddeld binnen 30 minuten bij u. Onze 24/7 storingsdienst is het hele jaar door beschikbaar.",
            },
          },
          {
            "@type": "Question",
            name: "Is VoltFix gecertificeerd?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja, al onze elektriciens zijn NEN 3140 gecertificeerd en volledig verzekerd. We werken volgens de laatste veiligheidsnormen.",
            },
          },
          {
            "@type": "Question",
            name: "In welke gebieden werkt VoltFix?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "VoltFix is actief in heel Nederland, met snelle service in Amsterdam, Rotterdam, Den Haag, Utrecht en omgeving.",
            },
          },
        ],
        ...data,
      };

    case "BreadcrumbList":
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: data?.items || [],
      };

    default:
      return {};
  }
}

// Component for adding all customer-facing SEO data at once
export function CustomerSiteStructuredData() {
  return (
    <>
      <StructuredData type="LocalBusiness" />
      <StructuredData type="FAQPage" />
    </>
  );
}
