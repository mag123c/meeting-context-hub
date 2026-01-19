import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PRDSummary as PRDSummaryType } from "@/repositories/types";

interface PRDSummaryProps {
  prd: PRDSummaryType;
}

export function PRDSummary({ prd }: PRDSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PRD 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <section>
          <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
            Problem
          </h3>
          <p className="text-sm text-foreground leading-relaxed">{prd.problem}</p>
        </section>

        <div className="border-t border-border" />

        <section>
          <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
            Goal
          </h3>
          <p className="text-sm text-foreground leading-relaxed">{prd.goal}</p>
        </section>

        <div className="border-t border-border" />

        <section>
          <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
            Scope
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1.5 text-foreground">
            {prd.scope.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        </section>

        <div className="border-t border-border" />

        <section>
          <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
            Requirements
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1.5 text-foreground">
            {prd.requirements.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
