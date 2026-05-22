import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";
import ContactInfo from "@/components/public/ContactInfo";
import ContactHero from "@/components/public/ContactHero";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contactate con VALMONT. Respondemos todas las consultas en menos de 24hs.",
};

export default function ContactoPage() {
  return (
    <>
      <ContactHero />

      {/* Formulario + info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          <div className="contact-form-col">
            <p className="label-tag text-muted-foreground text-[10px] mb-4 tracking-widest">ENVIANOS UN MENSAJE</p>
            <ContactForm />
          </div>
          <div className="contact-info-col">
            <ContactInfo />
          </div>
        </div>
      </section>

      {/* Cierre "HABLEMOS" */}
      <ContactClose />
    </>
  );
}

// Server Component para la franja de cierre
function ContactClose() {
  return (
    <section className="bg-green-dark overflow-hidden relative py-24 flex flex-col items-center justify-center text-center px-4">
      <div className="contact-close-inner">
        <p className="label-tag text-cream-dark text-[10px] mb-4 tracking-widest">VALMONT</p>
        <h2 className="font-bebas text-[clamp(60px,12vw,120px)] text-brand-cream leading-none">
          HABLEMOS
        </h2>
        <p className="label-tag text-cream-dark mt-4 tracking-widest">
          RESPONDEMOS TODAS LAS CONSULTAS
        </p>
      </div>
    </section>
  );
}
