export function urlPathToFileCandidates(urlPath: string): string[] {
  if (urlPath === "/" || urlPath === "") {
    return ["index.html", "index.htm"];
  }
  const stripped = urlPath.replace(/^\//, "").replace(/\/$/, "");
  return [
    `${stripped}.html`,
    `${stripped}.htm`,
    `${stripped}/index.html`,
    `${stripped}/index.htm`,
  ];
}
