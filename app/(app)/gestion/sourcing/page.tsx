import { Truck, Users, Star, MapPin } from "lucide-react";
import { V2Placeholder } from "../_components/v2-placeholder";

export const dynamic = "force-dynamic";

export default function SourcingPage() {
  return (
    <V2Placeholder
      title="Fournisseurs & Sourcing"
      description="Gérez vos sources d'approvisionnement et trouvez les meilleurs deals."
      features={[
        {
          icon: Users,
          label: "Carnet de fournisseurs",
          desc: "Mandataires, ventes aux enchères, particuliers, collègues du réseau.",
        },
        {
          icon: Star,
          label: "Notation & historique",
          desc: "Évaluez la fiabilité de chaque source au fil de vos achats.",
        },
        {
          icon: MapPin,
          label: "Recherche élargie",
          desc: "Identifiez les opportunités proches de chez vous ou en France entière.",
        },
        {
          icon: Truck,
          label: "Suivi de livraison",
          desc: "Logistique : transports, délais, frais associés.",
        },
      ]}
    />
  );
}
