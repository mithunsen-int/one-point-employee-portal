// Location values are placeholders pending real business confirmation — see
// discovery-analysis.md's tracked BRD-005 open item ("Location is implied but
// not confirmed"). Not real office/city names; a stand-in list only, until a
// real decision is made and this file is updated with actual values.
//
// Deliberately defined independently from src/services/constants/referenceValues.ts
// (the backend module) — per AC5, each layer is its own single source of
// truth; this file must never import from that one, and vice versa.
export const location: readonly string[] = [
  "Location A",
  "Location B",
  "Location C",
  "Location D",
  "Location E",
  "Location F",
  "Location G",
  "Location H",
];
