import { redirect } from "next/navigation";
import { getSessionPlayer } from "@/lib/prode/auth";
import ProdeForm from "@/components/prode/ProdeForm";

export const metadata = { title: "Jugar — Prode Mundial" };

export default async function ProdeJugarPage() {
  const player = await getSessionPlayer();
  if (!player) redirect("/prode/login");
  return <ProdeForm instagram={player.instagram} />;
}
