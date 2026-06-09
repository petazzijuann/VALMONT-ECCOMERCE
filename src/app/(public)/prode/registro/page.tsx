import { redirect } from "next/navigation";
import { getSessionPlayer } from "@/lib/prode/auth";
import ProdeAuthForm from "@/components/prode/ProdeAuthForm";

export const metadata = { title: "Registrarse — Prode Mundial" };

export default async function ProdeRegistroPage() {
  const player = await getSessionPlayer();
  if (player) redirect("/prode/jugar");
  return <ProdeAuthForm mode="register" />;
}
