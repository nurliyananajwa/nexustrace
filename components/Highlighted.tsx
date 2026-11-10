// Shows text with the words flagged by the quality checker highlighted.
export default function Highlighted({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <>{text}</>;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  return (
    <>
      {text.split(re).map((part, i) =>
        words.some((w) => w.toLowerCase() === part.toLowerCase())
          ? <span key={i} className="hl">{part}</span>
          : <span key={i}>{part}</span>,
      )}
    </>
  );
}
