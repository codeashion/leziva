import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#EAE6DE] flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md bg-[#F8F5EF] p-8 sm:p-12 rounded-3xl border border-[#DED6CB] shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#102B3A] text-[#EF8557] flex items-center justify-center mx-auto shadow-md">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#EF8557] block mb-1">
            404 NOT FOUND
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#102B3A]">
            Page Out of Drape
          </h1>
          <p className="text-xs text-[#77716A] mt-2 leading-relaxed">
            The creation you are searching for might have moved to another archive, or the link may have been woven differently.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#EF8557] hover:bg-[#DF7446] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            <span>Return to Maison</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
