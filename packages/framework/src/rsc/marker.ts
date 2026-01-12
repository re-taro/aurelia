const markerPrefix = "__AURELIA_APP_ENTRY__";

export function generateAppMarker(): string {
  return `${markerPrefix}${crypto.randomUUID()}`;
}
