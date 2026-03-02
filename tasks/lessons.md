# Lessons Learned

## Communication
- **No recap summaries**: Don't give full conclusion/recap after every change. Just implement and move on. The user reads the code, not a changelog.

## Technical
- **React Strict Mode double-mount**: Module-level `cancelled` flags break under strict mode. Use shared promises for deduplication instead of in-flight sets.
- **API response shape**: Always check what the API actually returns (`{ results: [...] }` vs bare array) before accessing fields.
- **Case-sensitive filenames**: macOS is case-insensitive but git is case-sensitive. Use `git mv` for renames.
- **Supabase RLS**: Always include `with check (true)` on insert/update policies.
- **Deprecated models**: Anthropic model names change. Use current model identifiers.
- **shadcn + Tailwind v4**: Need `@source` directives for content scanning. Aggressive global CSS resets break shadcn.
- **Sheet trigger conflict**: Don't use `SheetTrigger` for toggle buttons — use manual `onClick` with `setOpen`.
