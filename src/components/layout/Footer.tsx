export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-brand-900/10 px-4 py-4 text-center text-xs text-stone-400">
      <p className="font-medium tracking-wide text-stone-500">
        AET SustainTek　<span className="tracking-[0.3em]">宇沛永續</span>
      </p>
      <p className="mt-0.5">© {year} 宇沛永續股份有限公司</p>
    </footer>
  );
}
