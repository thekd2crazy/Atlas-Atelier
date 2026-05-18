import { getOneComposant } from "@/lib/stock-api";
import { notFound } from "next/navigation";
import StockDetailClient from "./StockDetailClient";


type Props = {
  params: Promise<{ id: string }>;  // ✅ Promise !
};

export default async function StockDetail({ params }: Props) {
    const { id } = await params;  // ✅ Unwrap !
    const idComposant = Number(id);

    let composant;
    try {
        composant = await getOneComposant(idComposant);
    } catch {
        notFound();
    }

    return <StockDetailClient initialComposant={composant} />;
}