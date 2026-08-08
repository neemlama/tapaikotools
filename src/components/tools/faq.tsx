import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

/** Native <details>/<summary> accordion — no JS state needed for expand/collapse. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {items.map((item) => (
        <details key={item.question} className="group p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-headline-md marker:content-none [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-body-md text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
