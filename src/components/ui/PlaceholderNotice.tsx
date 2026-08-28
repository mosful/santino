export default function PlaceholderNotice({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
      ⚠️ {text}
    </div>
  );
}
