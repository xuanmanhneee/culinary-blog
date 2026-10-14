import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Culinary Blog. Bảo lưu mọi quyền.</p>
        <nav aria-label="Liên kết chân trang" className="flex gap-4">
          <Link href="/" className="hover:text-emerald-800">Trang chủ</Link>
          <Link href="/search" className="hover:text-emerald-800">Tìm công thức</Link>
        </nav>
      </div>
    </footer>
  );
}
