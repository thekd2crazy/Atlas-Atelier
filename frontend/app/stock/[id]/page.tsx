import { getOneComposant } from "@/lib/stock-api"

type composant = {
    params: Promise<{ id: string }>
}

export default function StockIDPage() {
    return(
        <>
            <h1>composants</h1>
        </>
    );
}