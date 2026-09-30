import { requireUser } from "@/lib/auth/server";
import { SearchBox } from "@/components/search/search-box";

export const metadata = {
  title: "Search",
};

export default async function SearchPage() {
  await requireUser();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Semantic search</h1>
        <p className="text-sm text-slate-600 mt-1">
          Search the text of all published manuals (and your own drafts).
        </p>
      </div>
      <SearchBox />
    </div>
  );
}