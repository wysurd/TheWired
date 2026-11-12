export interface Article {
  id: string;
  title: string;
  authors: string;
  date: string;
  category: string;
  url: string;
  summary: string;
}
export const initialArticles: Article[] = [
  {
    id: "1706.03762",
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    date: "2017-06-12",
    category: "ARCHITECTURES",
    url: "https://arxiv.org/abs/1706.03762",
    summary:
      "The Transformer: an architecture based entirely on attention, dispensing with recurrence and convolutions.",
  },
  {
    id: "2303.08774",
    title: "GPT-4 Technical Report",
    authors: "OpenAI",
    date: "2023-03-15",
    category: "LANGUAGE MODELS",
    url: "https://arxiv.org/abs/2303.08774",
    summary:
      "Capabilities, limitations, and evaluation of a large-scale multimodal model.",
  },
  {
    id: "2010.11929",
    title: "An Image is Worth 16x16 Words",
    authors: "Dosovitskiy et al.",
    date: "2020-10-22",
    category: "COMPUTER VISION",
    url: "https://arxiv.org/abs/2010.11929",
    summary:
      "Applying a pure Transformer directly to sequences of image patches for image classification.",
  },
  {
    id: "1609.02907",
    title: "Semi-Supervised Classification with Graph Convolutional Networks",
    authors: "Kipf & Welling",
    date: "2016-09-09",
    category: "GRAPH LEARNING",
    url: "https://arxiv.org/abs/1609.02907",
    summary:
      "An efficient approach to learning representations on graph-structured data.",
  },
];
export async function fetchArticles(signal: AbortSignal): Promise<Article[]> {
  const response = await fetch(
    "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=TITLE_ABS:%22deep%20learning%22&format=json&sort_date:y&pageSize=12&resultType=core",
    { signal },
  );
  if (!response.ok) throw new Error("Research source unavailable");
  const data = await response.json();
  const entries = data?.resultList?.result;
  if (!Array.isArray(entries) || !entries.length)
    throw new Error("No research returned");
  return entries
    .filter(
      (a: Record<string, unknown>) =>
        typeof a.title === "string" &&
        typeof a.id === "string" &&
        typeof a.source === "string",
    )
    .map((a: Record<string, string>) => ({
      id: `${a.source}:${a.id}`,
      title: a.title,
      authors: a.authorString || "Authors unavailable",
      date: a.firstPublicationDate || a.pubYear,
      category: "DEEP LEARNING",
      url: `https://europepmc.org/article/${encodeURIComponent(a.source)}/${encodeURIComponent(a.id)}`,
      summary: (a.abstractText || "Read the full abstract at Europe PMC.")
        .replace(/<[^>]*>/g, "")
        .slice(0, 500),
    }));
}
