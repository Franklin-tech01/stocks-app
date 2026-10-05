import { Layers, LineChart, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

interface Props {
  totalInvestment: number;
  sharesOwned: number;
  portfolioValue: number;
}

export function PortfolioCard({ totalInvestment, sharesOwned, portfolioValue }: Props) {
  const items = [
    { label: "Total Investment", value: formatMoney(totalInvestment), icon: PiggyBank },
    { label: "Shares Owned", value: String(sharesOwned), icon: Layers },
    { label: "Portfolio Value", value: formatMoney(portfolioValue), icon: LineChart },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
      {items.map((it) => (
        <Card key={it.label} className="flex items-center gap-4 p-4 transition-shadow hover:shadow-pop lg:p-5">
          <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
            <it.icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{it.label}</p>
            <p className="tabular truncate font-display text-lg font-semibold">{it.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
