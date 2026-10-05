import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_PAGE_SIZE, type Page } from "@/lib/data/admin-lists";

/** GET form: submitting reloads the page with ?q=…, which also resets to page 1. */
export function SearchBox({ q, placeholder }: { q: string; placeholder: string }) {
  return (
    <form className="flex w-full max-w-md gap-2" role="search">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder={placeholder} className="pl-10" />
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
}

export function Pager({ data, basePath }: { data: Page<unknown>; basePath: string }) {
  const href = (page: number) => {
    const params = new URLSearchParams();
    if (data.q) params.set("q", data.q);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const from = data.total === 0 ? 0 : (data.page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(data.page * ADMIN_PAGE_SIZE, data.total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p>
        {from}–{to} of {data.total}
        {data.q && <> matching &ldquo;{data.q}&rdquo;</>}
      </p>
      <div className="flex items-center gap-2">
        {data.page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(data.page - 1)}>
              <ChevronLeft /> Prev
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft /> Prev
          </Button>
        )}
        <span className="tabular px-1">
          Page {data.page} / {data.pages}
        </span>
        {data.page < data.pages ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(data.page + 1)}>
              Next <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}
