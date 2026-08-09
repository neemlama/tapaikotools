export interface FaqItem {
  question: string;
  answer: string;
}

/** Always-visible 2-column Q&A grid — matches Stitch's FAQ sections, which are short enough (2-4 items) that a collapsible accordion adds a click for no real space savings. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.question}>
          <h3 className="text-headline-md">{item.question}</h3>
          <p className="mt-2 text-body-md text-muted-foreground">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}
