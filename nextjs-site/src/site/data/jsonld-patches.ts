import type { LegacyScript } from "@/src/site/legacy-content";
import { reuseVideos, userVideos } from "@/src/site/components/pages/VideosPage";

/*
 * React-side seam for structured data (site review 2026-09, slice C).
 *
 * JSON-LD is still extracted from the archived legacy HTML, which is frozen,
 * so content added in React since the freeze was invisible to crawlers and
 * some legacy type choices were wrong. The patches below are applied to the
 * extracted blocks at build time. Existing blocks are patched in place, never
 * added, so each page keeps its JSON-LD script count (checked by
 * `parity:content`).
 *
 * Facts are copied from the page content (titles, authors, journals, DOIs,
 * dates as displayed); nothing is added that the site does not show.
 */

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const SITE = "https://himmp.net";
const GUIDE_BOOK_ID = `${SITE}/findings.html#practical-guide`;
const GUIDE_TITLE = "Heaviness in Metal Music Production: A Practical Guide";

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/* The home page's canonical URL is `/`, not `/index.html`. */
function canonicaliseHomeUrls(value: Json): Json {
  if (typeof value === "string") return value === `${SITE}/index.html` ? `${SITE}/` : value;
  if (Array.isArray(value)) return value.map(canonicaliseHomeUrls);
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, canonicaliseHomeUrls(entry)]));
  }
  return value;
}

function doi(value: string): JsonObject {
  return { "@type": "PropertyValue", propertyID: "DOI", value, url: `https://doi.org/${value}` };
}

const himmpAuthors = (order: "herbst-mynett" | "mynett-herbst" | "herbst-smialek"): Json[] => {
  const herbst = { "@type": "Person", name: "Jan Herbst", sameAs: "https://orcid.org/0000-0001-7453-0141" };
  const mynett = { "@type": "Person", name: "Mark Mynett", sameAs: "https://orcid.org/0000-0001-5145-4668" };
  if (order === "mynett-herbst") return [mynett, herbst];
  if (order === "herbst-smialek") return [herbst, { "@type": "Person", name: "Eric Smialek" }];
  return [herbst, mynett];
};

type ProjectOutput = {
  type: "ScholarlyArticle" | "Chapter" | "Article" | "Dataset";
  name: string;
  authors?: "herbst-mynett" | "mynett-herbst" | "herbst-smialek";
  partOf?: { type: "Periodical" | "Book"; name: string };
  details?: string;
  doi?: string;
  url?: string;
  datePublished?: string;
};

/*
 * `publications.html` → "HiMMP Project Outputs" entries that were missing
 * from the legacy ItemList, copied from `PublicationsPage.tsx` (lines
 * 128-400). `details` is the page's volume/issue/page text verbatim.
 */
const missingProjectOutputs: ProjectOutput[] = [
  { type: "Dataset", name: "'In Solitude' Multitrack", doi: "10.5281/zenodo.20607978", datePublished: "2026" },
  { type: "Dataset", name: "'In Solitude' Producer Mixes and Stems", doi: "10.5281/zenodo.20608441", datePublished: "2026" },
  {
    type: "ScholarlyArticle",
    name: "Metal Music and the Aesthetics of Heaviness: Sonic, Structural, and Affective Perspectives",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "Rock Music Studies" },
    doi: "10.1080/19401159.2025.2535100"
  },
  {
    type: "ScholarlyArticle",
    name: "Aesthetic Tensions in Metal Production: Genre Expectations, Technological Mediation, and Creative Freedom",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "Popular Music & Society" },
    details: "49(1)",
    doi: "10.1080/03007766.2025.2530807"
  },
  {
    type: "ScholarlyArticle",
    name: "\"Mixed\" Results: An Introduction to Analyzing Metal Production through Eight Commissioned Metal Mixes",
    authors: "herbst-smialek",
    partOf: {
      type: "Periodical",
      name: "Zeitschrift der Gesellschaft für Musiktheorie (Journal of the German-Speaking Society for Music Theory)"
    },
    details: "22/1",
    doi: "10.31751/1222"
  },
  {
    type: "Chapter",
    name: "Contemporary Approaches to Metal Music Mixing and Production: Heavy Metal, Death Metal, and Metalcore",
    authors: "herbst-mynett",
    partOf: { type: "Book", name: "The Routledge Handbook of Metal Music Composition" },
    details: "pp. 469–481",
    doi: "10.4324/9781003354451-34"
  },
  {
    type: "Article",
    name: "Masters of the Art of Mixing: 8 Producers – One Song – Infinite Insights",
    authors: "mynett-herbst",
    partOf: { type: "Periodical", name: "Sound on Sound" },
    details: "9/2024, pp. 52–61",
    url: "https://www.soundonsound.com/techniques/masters-art-mixing"
  },
  {
    type: "Chapter",
    name: "Mapping the Origins of Heaviness Between 1970 and 1995: A Historical Overview of Metal Music Production",
    authors: "herbst-mynett",
    partOf: { type: "Book", name: "The Cambridge Companion to Metal Music" },
    details: "pp. 29–42",
    doi: "10.1017/9781108991162.003"
  },
  {
    type: "ScholarlyArticle",
    name: "Lorna Shore's 'To the Hellfire': A Study in Heaviness",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "Metal Music Studies" },
    details: "9(2), pp. 189–213",
    doi: "10.1386/mms_00105_1"
  },
  {
    type: "ScholarlyArticle",
    name: "\"I Just Go with What Feels Right.\" Variance and Commonality in Metal Music Mixing Practice",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "El Oido Pensante" },
    details: "11(1), pp. 4–31",
    doi: "10.34096/oidopensante.v11n1.10704"
  },
  {
    type: "Article",
    name: "What Exactly Is \"Heaviness\" in Heavy Metal Music?",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "Futurum" },
    details: "9/2022",
    doi: "10.33424/FUTURUM297"
  },
  {
    type: "ScholarlyArticle",
    name: "What is 'Heavy' in Metal? A Netnographic Analysis of Online Forums for Metal Musicians and Producers",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "Popular Music and Society" },
    details: "45(5), pp. 633–653",
    doi: "10.1080/03007766.2022.2114155"
  },
  {
    type: "ScholarlyArticle",
    name: "Toward a Systematic Understanding of \"Heaviness\" in Metal Music Production",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "Rock Music Studies" },
    details: "10(1), pp. 16–37",
    doi: "10.1080/19401159.2022.2109358"
  },
  {
    type: "ScholarlyArticle",
    name: "Nail the Mix: Standardization in Mixing Metal Music?",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "Popular Music and Society" },
    details: "44(5), pp. 628–649",
    doi: "10.1080/03007766.2021.1957544"
  },
  {
    type: "ScholarlyArticle",
    name: "(No?) Adventures in Recording Land: Engineering Conventions in Metal Music",
    authors: "herbst-mynett",
    partOf: { type: "Periodical", name: "Rock Music Studies" },
    details: "9(2), pp. 137–156",
    doi: "10.1080/19401159.2021.1936410"
  }
];

function projectOutputNode(output: ProjectOutput): JsonObject {
  const node: JsonObject = { "@type": output.type, name: output.name };
  if (output.authors) node[output.type === "Dataset" ? "creator" : "author"] = himmpAuthors(output.authors);
  if (output.partOf) node.isPartOf = { "@type": output.partOf.type, name: output.partOf.name };
  if (output.details) node.description = `${output.partOf?.name ?? ""} ${output.details}`.trim();
  if (output.doi) {
    node.identifier = doi(output.doi);
    node.url = `https://doi.org/${output.doi}`;
  } else if (output.url) {
    node.url = output.url;
  }
  if (output.datePublished) node.datePublished = output.datePublished;
  return node;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/* "Warlock Studios • 18 September 2025" → { uploader, date: "2025-09-18" } */
export function parseVideoMeta(meta: string): { uploader: string; date: string } {
  const [uploader, when] = meta.split(" • ");
  const match = when?.match(/^(\d{1,2}) ([A-Z][a-z]+) (\d{4})$/);
  const month = match ? MONTHS.indexOf(match[2]) + 1 : 0;
  if (!uploader || !match || month === 0) throw new Error(`Unparseable video meta: ${meta}`);
  return { uploader, date: `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}` };
}

function videoNode(video: { embedId: string; heading: string; meta: string }): JsonObject {
  const { uploader, date } = parseVideoMeta(video.meta);
  return {
    "@type": "VideoObject",
    name: video.heading,
    description: `${video.heading} (${uploader}, YouTube).`,
    thumbnailUrl: `https://img.youtube.com/vi/${video.embedId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${video.embedId}`,
    uploadDate: date
  };
}

function findAll(value: Json, predicate: (node: JsonObject) => boolean, found: JsonObject[] = []): JsonObject[] {
  if (Array.isArray(value)) value.forEach((entry) => findAll(entry, predicate, found));
  else if (isObject(value)) {
    if (predicate(value)) found.push(value);
    Object.values(value).forEach((entry) => findAll(entry, predicate, found));
  }
  return found;
}

const RECORDING_ID = `${SITE}/#in-solitude-recording`;

/*
 * Every ResearchProject node (home, about, approach) is normalised in place:
 * lifecycle dates become Organization properties (ResearchProject has no
 * startDate/endDate); PI and Co-I become members in a role rather than
 * founders; the grant moves from funder.identifier to funding → Grant; and
 * the musicians, who performed on the project's recording of 'In Solitude'
 * rather than in the project, move to a MusicRecording node. Returns the
 * performers removed so the caller can place the recording.
 */
function normaliseResearchProject(project: JsonObject): Json[] {
  if ("startDate" in project) {
    project.foundingDate = project.startDate;
    delete project.startDate;
  }
  if ("endDate" in project) {
    project.dissolutionDate = project.endDate;
    delete project.endDate;
  }

  if (Array.isArray(project.founder)) {
    const roles = project.founder.filter(isObject).map((person) => {
      const { jobTitle, ...personFields } = person;
      return { "@type": "OrganizationRole", roleName: jobTitle ?? null, member: personFields } as JsonObject;
    });
    project.member = [...(Array.isArray(project.member) ? project.member : []), ...roles];
    delete project.founder;
  }

  if (isObject(project.funder) && typeof project.funder.identifier === "string") {
    const { identifier, ...funder } = project.funder;
    project.funding = { "@type": "Grant", identifier, funder };
    project.funder = funder;
  }

  const performers = Array.isArray(project.performer) ? project.performer : [];
  delete project.performer;
  return performers;
}

// Mark Deeks is credited with orchestration, not performance
// (ApproachPage.tsx: "Mark Deeks (orchestration; Winterfylleth)").
const ORCHESTRATOR_ID = `${SITE}/#person-mark-deeks`;

const isOrchestrator = (entry: Json) => isObject(entry) && entry["@id"] === ORCHESTRATOR_ID;

/* Moves the orchestrator from byArtist to a contributor Role, in place. */
function creditOrchestration(recording: JsonObject): void {
  const artists = Array.isArray(recording.byArtist) ? recording.byArtist : recording.byArtist ? [recording.byArtist] : [];
  if (!artists.some(isOrchestrator)) return;
  recording.byArtist = artists.filter((entry) => !isOrchestrator(entry));
  const role: JsonObject = { "@type": "Role", roleName: "orchestration", contributor: { "@id": ORCHESTRATOR_ID } };
  const existing = Array.isArray(recording.contributor)
    ? recording.contributor
    : recording.contributor
      ? [recording.contributor]
      : [];
  recording.contributor = existing.length ? [...existing, role] : role;
}

function recordingNode(performers: Json[]): JsonObject {
  const node: JsonObject = { "@type": "MusicRecording", "@id": RECORDING_ID, name: "In Solitude", byArtist: performers };
  creditOrchestration(node);
  return node;
}

function patchResearchProjects(block: JsonObject): JsonObject {
  const patched = JSON.parse(JSON.stringify(block)) as JsonObject;
  const performers: Json[] = [];
  for (const project of findAll(patched, (node) => node["@type"] === "ResearchProject")) {
    performers.push(...normaliseResearchProject(project));
  }
  // Legacy MusicRecording nodes (e.g. approach.html) get the same credit fix.
  for (const recording of findAll(patched, (node) => node["@type"] === "MusicRecording")) {
    creditOrchestration(recording);
  }
  if (performers.length === 0) return patched;

  const unique = [...new Map(performers.map((entry) => [JSON.stringify(entry), entry])).values()];
  if (patched["@type"] === "ResearchProject") {
    // Top-level project (home): project and recording side by side.
    const { "@context": context, ...project } = patched;
    return { "@context": context ?? "https://schema.org", "@graph": [project, recordingNode(unique)] };
  }
  // Nested project (about): the page mentions the recording.
  const mentions = Array.isArray(patched.mentions) ? patched.mentions : patched.mentions ? [patched.mentions] : [];
  patched.mentions = [...mentions, recordingNode(unique)];
  return patched;
}

function doiOf(node: JsonObject): string | null {
  const text = JSON.stringify([node.url ?? null, node.identifier ?? null, node.sameAs ?? null]);
  const match = text.match(/10\.\d{4,9}\/[^\s"?#]+/);
  return match ? match[0].toLowerCase() : null;
}

function normalisedTitle(value: Json | undefined): string {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/*
 * Existing legacy records are matched to the page's outputs by DOI, then by
 * title. A match takes the page's visible publication type (Chapter,
 * magazine Article) and gains the DOI identifier if it lacked one; its
 * other legacy fields are kept. Unmatched outputs are appended.
 */
function patchPublications(block: JsonObject): JsonObject {
  if (block["@type"] !== "ItemList" || !Array.isArray(block.itemListElement)) return block;
  const outputs = missingProjectOutputs.map((output) => ({ output, node: projectOutputNode(output) }));
  const matched = new Set<ProjectOutput>();

  const items = block.itemListElement.map((item) => {
    if (!isObject(item)) return item;
    if (item["@type"] === "ScholarlyArticle" && String(item.name).startsWith("Heaviness in Metal Music Production, Volume")) {
      return { ...item, "@type": "Book" };
    }
    const itemDoi = doiOf(item);
    const hit = outputs.find(
      ({ node }) =>
        (itemDoi !== null && doiOf(node) === itemDoi) || normalisedTitle(node.name) === normalisedTitle(item.name)
    );
    if (!hit) return item;
    matched.add(hit.output);
    const merged: JsonObject = { ...item, "@type": hit.output.type };
    if (!merged.identifier && hit.node.identifier) merged.identifier = hit.node.identifier;
    if (hit.output.type === "Chapter" && hit.node.isPartOf) merged.isPartOf = hit.node.isPartOf;
    return merged;
  });

  const additions = outputs.filter(({ output }) => !matched.has(output)).map(({ node }) => node);
  return { ...block, itemListElement: [...items, ...additions] };
}

function patchFindingsIndex(block: JsonObject): JsonObject {
  const patched = JSON.parse(JSON.stringify(block)) as JsonObject;
  for (const node of findAll(patched, (candidate) => candidate["@type"] === "CollectionPage")) {
    node.name = GUIDE_TITLE;
    node.headline = GUIDE_TITLE;
  }
  return patched;
}

function patchChapter(block: JsonObject): JsonObject {
  if (block["@type"] !== "TechArticle") return block;
  return { ...block, isPartOf: { "@id": GUIDE_BOOK_ID } };
}

function patchVideos(block: JsonObject): JsonObject {
  const patched = JSON.parse(JSON.stringify(block)) as JsonObject;
  const existing = findAll(patched, (node) => node["@type"] === "VideoObject");
  if (existing.length === 0) return block;
  const embedded = new Set(existing.map((node) => node.embedUrl));
  const additions = [...userVideos, ...reuseVideos]
    .map(videoNode)
    .filter((node) => !embedded.has(node.embedUrl));
  // Append next to the existing VideoObjects, in whichever array holds them.
  const holder = findAll(patched, (node) =>
    Object.values(node).some((value) => Array.isArray(value) && value.some((entry) => isObject(entry) && entry["@type"] === "VideoObject"))
  )[0];
  const key = holder && Object.keys(holder).find((name) => Array.isArray(holder[name]) && (holder[name] as Json[]).some((entry) => isObject(entry) && entry["@type"] === "VideoObject"));
  if (!holder || !key) throw new Error("videos.html: cannot locate the VideoObject list");
  holder[key] = [...(holder[key] as Json[]), ...additions];
  // contentUrl is for the media file itself; a YouTube watch page belongs in
  // embedUrl only (Google video structured-data guidelines).
  for (const video of findAll(patched, (node) => node["@type"] === "VideoObject")) {
    if (typeof video.contentUrl === "string" && /youtube\.com\/watch/.test(video.contentUrl)) delete video.contentUrl;
  }
  return patched;
}

const pagePatches: Record<string, (block: JsonObject) => JsonObject> = {
  "publications.html": patchPublications,
  "findings.html": patchFindingsIndex,
  "videos.html": patchVideos
};

function patchFor(sourceFile: string): ((block: JsonObject) => JsonObject) | undefined {
  if (pagePatches[sourceFile]) return pagePatches[sourceFile];
  if (/^findings\/\d{2}-[^/]+\.html$/.test(sourceFile)) return patchChapter;
  return undefined;
}

/* Serialise for an inline <script>: `<` is escaped so no string can close the element. */
function serialise(value: Json): string {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

export function applyJsonLdPatches(sourceFile: string, scripts: LegacyScript[]): LegacyScript[] {
  const patch = patchFor(sourceFile);
  return scripts.map((script) => {
    if (script.src !== null) return script;
    const parsed = canonicaliseHomeUrls(JSON.parse(script.content) as Json);
    const normalised = isObject(parsed) ? patchResearchProjects(parsed) : parsed;
    const result = patch && isObject(normalised) ? patch(normalised) : normalised;
    return { ...script, content: serialise(result) };
  });
}
