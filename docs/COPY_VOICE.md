# NyaayWatch public copy voice

Ground rules for any text that lands on a public page (HTML, OG cards,
press kit, API descriptions, error states). Methodology pages have a
narrower exception, called out below.

## The voice in one paragraph

Plain Indian English. Short sentences. Name things directly — "Supreme
Court", not "the top of the court system"; "last month", not "the latest
monthly window". Describe what the number means and what changed; do
not narrate the data pipeline at the reader.

## Rules

1. **Say the court by name.** "Supreme Court", "High Court of …", or
   "this district". Never "the top of the court system", "the apex
   court", or "the Court" as a standalone noun on first mention.

2. **Time windows are concrete.** "last month" or a date range.
   Never "the latest monthly window" or "the latest published month".

3. **Cases, not matters.** Use "cases" when counting. "Matters" is
   acceptable only inside a fixed legal phrase (e.g. "civil and criminal
   matters" describing a registry category).

4. **Filings and clearances, not institutions and dispositions.** Use
   "filed" / "cleared" in user copy. The raw NJDG verbs ("instituted",
   "disposed") stay in source-data labels and methodology only.

5. **Do not narrate the publishing pipeline in tile notes or hero
   copy.** Tile notes describe what the number means, not where it came
   from. Phrases like "in the latest published snapshot" or "based on
   the latest published snapshot" do not belong on the home, overview,
   district, or press surfaces — they describe our process, not the
   reader's question. The methodology page is the one place where
   "published snapshot" is the term of art and is allowed.

6. **No cute metaphors for steady state.** "In lockstep", "moving
   together", "neck and neck" → use "Steady" or "Filings and clearances
   matched last month."

7. **Contractions are fine.** "doesn't", "isn't", "what's" — match
   spoken Indian English. Don't force formal "does not" / "is not"
   unless the sentence reads more clearly that way.

8. **Don't frame copy around who the reader is.** Describe the change,
   not the audience. Avoid "for journalists, …", "if you're a
   researcher, …".

## Banned phrases on public routes

Enforced by `tests/public-copy-guardrails.test.ts`. Adding to this list
is preferred over adding ad-hoc tests:

- `latest monthly window`
- `latest published month`
- `top of the court system`
- `moved in lockstep` / `in lockstep`
- `incoming work` (as a synonym for "cases")

`latest published snapshot` is **not** in the regex ban because it is
load-bearing on the methodology page. Reviewers should still reject it
on home / overview / district / press copy.

## Before / after

| Before | After |
| --- | --- |
| Backlog at the top of the court system in the latest published snapshot. | Cases still pending at the Supreme Court. |
| How quickly the Supreme Court is clearing incoming work in the latest monthly window. | How quickly the Supreme Court cleared cases last month. |
| How many matters the Court cleared in the latest published month. | Cases the Supreme Court cleared last month. |
| More matters were filed than cleared in the latest monthly window. | More cases were filed than cleared last month. |
| Filed and cleared moved in lockstep in the latest monthly window. | Filings and clearances matched last month. |
| What is the latest published snapshot showing in High Court of Himachal Pradesh? | What does the latest data show for High Court of Himachal Pradesh? |
| The API matches the latest published snapshot. | The API matches what's currently on the public site. |
| People appear to be waiting longer here than in much of Punjab, based on the latest published snapshot. | People appear to be waiting longer here than in much of Punjab. |

## When to ignore this guide

The methodology page is allowed to use the long form of the
publishing-pipeline vocabulary because it is documenting the discipline
itself. If you find yourself reaching for that vocabulary anywhere
else, write the plain version first; if you cannot make it work, link
to methodology instead of importing its terms.
