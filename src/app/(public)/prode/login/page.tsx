import { redirect } from "next/navigation";
import { getSessionPlayer } from "@/lib/prode/auth";
import ProdeAuthForm from "@/components/prode/ProdeAuthForm";

export const metadata = { title: "Ingresar — Prode Mundial" };

export default async function ProdeLoginPage() {
  const player = await getSessionPlayer();
  if (player) redirect("/prode/jugar");
  return <ProdeAuthForm mode="login" />;
}
