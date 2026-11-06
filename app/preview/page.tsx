export default function PreviewPage() {
  return (
    <main style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <iframe
        title="NexusTrace interactive design preview"
        src="/nexustrace-demo.html"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
    </main>
  );
}
