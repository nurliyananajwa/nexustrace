import Link from "next/link";

// The NexusTrace logo. Each page passes its own class for colour and size.
export default function Brand({ className }: { className: string }) {
  return (
    <Link className={className} href="/" aria-label="NexusTrace home">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <span>Nexus<span>Trace</span></span>
    </Link>
  );
}
