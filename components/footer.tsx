import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg text-white/80">ViralTweetLab</span>
          <span className="text-sm text-white/50">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex gap-6 text-sm text-white/60">
          <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
