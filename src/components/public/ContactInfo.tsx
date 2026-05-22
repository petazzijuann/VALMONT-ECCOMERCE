"use client";

import { useRef } from "react";
import { Mail, AtSign, MessageCircle } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const email     = process.env.NEXT_PUBLIC_CONTACT_EMAIL     ?? "hola@valmont.com.ar";
const instagram = process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM ?? "valmont.jarg";
const whatsapp  = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP  ?? "";

const ITEMS = [
  {
    icon: Mail,
    label: "Email",
    value: email,
    href: `mailto:${email}`,
  },
  {
    icon: AtSign,
    label: "Instagram",
    value: `@${instagram}`,
    href: `https://instagram.com/${instagram}`,
  },
  ...(whatsapp
    ? [{
        icon: MessageCircle,
        label: "WhatsApp",
        value: whatsapp,
        href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
      }]
    : []),
];

export default function ContactInfo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(".contact-item", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      });

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      <div>
        <p className="label-tag text-muted-foreground text-[10px] mb-2 tracking-widest">ENCONTRANOS</p>
        <h2 className="font-bebas text-4xl">ESTAMOS PARA AYUDARTE</h2>
      </div>

      <div className="flex flex-col gap-5 mt-2">
        {ITEMS.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="contact-item flex items-start gap-4">
            <div className="mt-0.5 text-brand-green shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <p className="label-tag text-muted-foreground text-[10px] mb-1">{label.toUpperCase()}</p>
              {href ? (
                <a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="relative text-sm font-medium group"
                >
                  {value}
                  <span className="absolute bottom-0 left-0 h-px w-0 bg-brand-green group-hover:w-full transition-all duration-300 ease-out" />
                </a>
              ) : (
                <p className="text-sm font-medium">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
