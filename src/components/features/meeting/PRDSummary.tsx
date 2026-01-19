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
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Problem
          </h3>
          <p className="text-sm">{prd.problem}</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Goal
          </h3>
          <p className="text-sm">{prd.goal}</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Scope
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {prd.scope.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Requirements
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {prd.requirements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
