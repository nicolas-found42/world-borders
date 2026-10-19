# Research: primary sources for 1776 historical boundary geometry

**Prepared:** 2026-10-19
**Scope:** Whether any licensed, primary historical geometry (polygons) exists for the bounded 1776 state of North America (US/Canada/Mexico predecessor territories), and whether a defensible historical-map digitization is available. This is a source and geometry feasibility review, not a boundary approval.

Cross-references: HISTORICAL_SLICE_RESEARCH.md, DATA_SOURCES.md, SPEC.md.

## Executive summary

**Still a gap.** No dataset found that provides licensed, primary 1776 state/territory polygons for the United States, Canada, or Mexico predecessor territories.

- The upstream Historical Basemaps index has **no 1776 entry** (1715 then 1783); direct 1775/1776 GeoJSON paths return 404. Its 1783 map is already excluded by this repo because Jacksonville falls inside the US before the 1821 Florida transfer.
- CShapes begins at 1886 (Europe 1816) and is CC BY-NC-SA 4.0 (non-commercial) — excluded by repo policy and out of range.
- Natural Earth is modern-only and public domain; no historical states.
- GADM is current-administration only and non-commercial without permission; no 1776 layer.
- Atlas of Historical County Boundaries (Newberry) is CC0 and runs 1629–2000 for US counties, but its U.S. Historical States and Territories layer starts 3 September 1783 (Treaty of Paris); it explicitly does not reconstruct colonial claims/boundaries before that date.
- NRCan Territorial Evolution begins 1867 (OGL-Canada); not 1776.
- ICOW / COW Territorial Change is tabular events from 1816, no geometry.
- The Library of Congress Pownall 1776 map is a raster image, free to use/reuse, but has no vector geometry; digitization would be a manual, claim-labeled undertaking, not a primary licensed dataset.

Best path if a 1776 layer is required: a **claim-labeled digitization** from a primary 1776 map (LOC Pownall 1776 or comparable), under curator review, with explicit unknown/indigenous and disputed regions. Not a defensible "effective control" boundary.

## Candidate datasets audited

### 1. Historical Basemaps (aourednik/historical-basemaps)

- URL: https://github.com/aourednik/historical-basemaps
- Index: https://raw.githubusercontent.com/aourednik/historical-basemaps/master/index.json
- License: GPL-3.0 (https://github.com/aourednik/historical-basemaps/blob/master/LICENSE)
- GeoJSON listing shows world_1715.geojson then world_1783.geojson; **no world_1776.geojson**.
- README calls the maps work in progress and says to verify against other sources before academic use.
- Finding: **no 1776 entry.** Confirms prior note. 1783 map excluded by this repo due Jacksonville-in-US-before-1821-Florida error.
- Redistribution: GPL-3.0 (copyleft); compatible with this repo's GPL-3.0-only application code, but no 1776 geometry to reuse.

### 2. CShapes (ETH Zurich)

- URL: https://icr.ethz.ch/data/cshapes/
- Coverage: independent states and dependent territories **1886–2019** (CShapes 2.0); CShapes-Europe from 1816. Starts well after 1776.
- License: **CC BY-NC-SA 4.0** (non-commercial share-alike) — https://www.loc.gov/item/2023592015/ (Rights Advisory: "Creative Commons Attribution Non Commercial Share Alike 4.0 International License").
- Finding: out of temporal range and non-commercial; already excluded by repo policy ("No CShapes or other noncommercial-only data is a required part of this bundle").

### 3. Natural Earth

- URL: https://www.naturalearthdata.com/
- License: public domain (https://www.naturalearthdata.com/about/terms-of-use/).
- Coverage: modern admin-0/admin-1 only; no historical states. Used by this repo as neutral physical land (land.geojson, 1:110m).
- Finding: no historical 1776 geometry. Public domain terms are ideal, but content absent.

### 4. GADM

- URL: https://gadm.org/data.html
- Coverage: current administrative areas only (v4.1). No historical 1776 layer.
- License: free for academic/non-commercial; redistribution/commercial requires permission (https://gadm.org/).
- Finding: not applicable for 1776; also non-commercial licensing.

### 5. Atlas of Historical County Boundaries (Newberry Library)

- URL: https://publications.newberry.org/ahcb/ ; download: https://publications.newberry.org/ahcb/download/
- License: CC0 ("No Rights Reserved") — https://www.loc.gov/item/2018487899/ ("Creative Commons CC0 'No Rights Reserved' license").
- Coverage: US Historical Counties 1629–2000 (dated to the day); **U.S. Historical States and Territories 3 September 1783 – 31 December 2000**.
- Finding: The states/territories layer **starts 1783** (Treaty of Paris) and "does not include all of the extensive and conflicting territorial claims of the original 13 colonies"; explicitly cannot be used to build pre-1783 colonial boundary polygons. Counties layer is not state-level sovereignty. Highly permissive license (CC0) but coverage gap remains for 1776.

### 6. NRCan Territorial Evolution of Canada (1867–2003)

- URL: https://open.canada.ca/data/en/dataset/e88ce995-b69a-4595-a752-bb06b061b5a3
- License: Open Government Licence – Canada (https://open.canada.ca/en/open-government-licence-canada) — worldwide, royalty-free, perpetual, non-exclusive, including commercial use, with attribution.
- Coverage: begins 1867. Not 1776. Used by this repo for 1880/1949 Canada/Newfoundland.
- Finding: no 1776 coverage.

### 7. ICOW / COW Territorial Change

- ICOW: https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/E6PSGZ (CC0 1.0)
- COW Territorial Change v6: https://correlatesofwar.org/data-sets/territorial-change/ (1816–2018, tabular events, no geometry)
- Coverage: 1816+; tabular claims/events, no polygons.
- Finding: not applicable for 1776 geometry; useful only as event/claim corroboration for later years.

### 8. ArcGIS "Geography of Colonial America 1775 (All Layers)"

- URL: https://www.arcgis.com/home/item.html?id=aaf0f38f260c488caf8a2809c6aae5f6
- License: CC BY-SA 4.0
- Author: Charles E. Frye
- Finding: a teaching/review feature layer (1775). License is permissive (CC BY-SA 4.0) but the item is undocumented ("No source acknowledged", "A brief summary ... is not available") and its layers are unverified for 1776 state-boundary polygons; it is a 1775 layer, not 1776, and its provenance is thin. Treat as an unverified candidate only; would require direct inspection and curator review before any use. Redistribution under CC BY-SA 4.0 is compatible but share-alike obligations apply.

### 9. Native Land

- URL: https://native-land.ca (GeoJSON available via API)
- Coverage: user-contributed indigenous territory conventions; not primary and not 1776 state boundaries.
- Finding: not a defensible primary source for 1776 state polygons; redistribution/terms are contributor-based. Useful only as context/indigenous limitation reference.

### 10. Canada Historic Treaties (CIRNAC/ISC)

- URL: https://open.canada.ca/data/en/dataset/f281b150-0645-48e4-9c30-01f55f93f78e
- License: Open Government (Canada) — Crown-Indigenous treaties 1725–1929.
- Coverage: indigenous treaty boundaries (estimated from written descriptions), not state boundaries; explicitly "informational and representational purposes only."
- Finding: not 1776 state geometry; relevant only to indigenous/unknown-region limitations.

## Historical map digitization candidates

### Library of Congress — Pownall 1776 map (primary raster)

- Item: https://www.loc.gov/item/74693073/
- Title: "A general map of the northern British colonies in America... 1776" (Sayer & Bennett; Holland; Pownall), scale ca. 1:3,700,000, 48 x 67 cm. Date 1776.
- Local artifact: artifacts/temporal-slice/1776-source-pages/LOC_POWnall_1776_ITEM.json
- Rights: LOC Geography and Map Division digitized collections — "free to use and reuse unless a Rights Advisory statement is present that indicates otherwise"; no Rights Advisory present; credit line "Library of Congress, Geography and Map Division." (https://www.loc.gov/item/74693073/)
- Digital images: https://tile.loc.gov/storage-services/service/gmd/gmd3/g3300/g3300/ar014300.jp2 (and copies 2/3); IIIF manifest https://www.loc.gov/item/74693073/manifest.json.
- Finding: high-quality primary 1776 raster, permissive reuse. **No vector geometry.** Any 1776 polygon layer derived from it would be a manual digitization (claim-labeled), requiring georeferencing, vectorization, and curator review. Scale ~1:3.7M limits precision; coastlines/rivers generalized. Coverage is "northern British colonies" — does not depict Spanish New Spain or French territories south/west in detail, and indigenous lands are not delineated as states.

### Other primary 1776-era maps (raster only)

- David Rumsey collection (https://www.davidrumsey.com/) — large historical map repository; raster, some reprojections; licensing varies per item (many CC BY-NC-SA). Not a licensed geometry dataset.
- LOC "American Revolution and Its Era: Maps and Charts of North America and the West Indies, 1750-1789" collection (https://www.loc.gov/collections/american-revolutionary-war-maps/) — raster images, free to use/reuse absent Rights Advisory. No vectors.
- Colonial charters / treaty lines (Virginia charters 1606/1609/1612; Carolina 1663/1665; Pennsylvania 1681; Treaty of Paris 1763; Fort Stanwix 1768; etc.) — primary legal definitions of claims, but textual (latitudes/degrees), not survey-grade geometry. No licensed geometry dataset derived from them was found.

## Provenance and redistribution terms (summary)

| Source | License | Commercial OK? | 1776 polygons? |
|---|---|---|---|
| Historical Basemaps | GPL-3.0 | yes (copyleft) | no (no 1776 entry) |
| CShapes 2.0 | CC BY-NC-SA 4.0 | no | no (starts 1886) |
| Natural Earth | public domain | yes | no (modern only) |
| GADM | academic/non-comm (permission otherwise) | no (without permission) | no |
| AHCB (Newberry) | CC0 | yes | no (states from 1783) |
| NRCan Territorial Evolution | OGL-Canada | yes (attribution) | no (from 1867) |
| ICOW / COW | CC0 / standard deposit | yes-ish | no (tabular, 1816+) |
| ArcGIS Colonial America 1775 | CC BY-SA 4.0 | yes (share-alike) | unverified candidate |
| LOC Pownall 1776 | free to use/reuse (no Rights Advisory) | yes (credit line) | no (raster only) |
| Native Land | contributor-based | unclear | no (not state boundaries) |
| Canada Historic Treaties | OGL-Canada | yes (attribution) | no (indigenous, estimated) |

## Indigenous and unknown-region limitations

- 1776 North America was not fully partitioned into European states. Large interior and western regions were indigenous-controlled or effectively unclaimed/unknown; no 1776 map assigns them to a polity with surveyed boundaries.
- Colonial charters defined paper claims (often to the Pacific) that did not reflect effective control; the 1763 Treaty of Paris set the Mississippi as a western limit for British claims, but Spanish New Spain and indigenous nations held the west.
- Canada's "Peace and Friendship Treaties" (1725–1779) and US-era treaties are estimated boundaries ("informational and representational purposes only"), not survey-grade.
- Any 1776 layer would need explicit labeling of unknown/unclaimed/indigenous regions and must not be presented as effective-control or verified boundaries. This mirrors this repo's existing discipline: "Coordinates are generalized world/continent-scale reference shapes... not a verified effective-control dataset."

## Recommendation

**1776 remains a gap.** No licensed primary historical geometry with 1776 polygons exists among the sources audited. The timeline origin should stay as 1776 with an explicit coverage gap and neutral physical land, per HISTORICAL_SLICE_RESEARCH.md.

If a 1776 geometry layer is required by the curator, the only defensible route is a **separately labeled claim layer** digitized from a primary 1776 map (LOC Pownall 1776 is the best candidate: permissive reuse, dated 1776, scale ~1:3.7M), with:
- explicit "claim, not effective control" labeling,
- unknown/indigenous/unclaimed regions marked,
- curator review of geometry,
- no interpolation from 1715 or 1783 maps,
- provenance recording image URL, hash, georeferencing control points, and vectorization method.

Do not backfill 1776 from 1783 (excluded) or 1715. Do not present the Declaration of Independence (National Archives transcription, https://www.archives.gov/founding-docs/declaration-transcript) as geometry.

## Sources cited (URLs)

- Historical Basemaps repo: https://github.com/aourednik/historical-basemaps
- Historical Basemaps index: https://raw.githubusercontent.com/aourednik/historical-basemaps/master/index.json
- Historical Basemaps geojson dir: https://github.com/aourednik/historical-basemaps/tree/master/geojson
- Historical Basemaps GPL-3.0: https://github.com/aourednik/historical-basemaps/blob/master/LICENSE
- CShapes: https://icr.ethz.ch/data/cshapes/
- CShapes 2.0 LOC record (CC BY-NC-SA 4.0): https://www.loc.gov/item/2023592015/
- Natural Earth terms: https://www.naturalearthdata.com/about/terms-of-use/
- GADM: https://gadm.org/data.html ; https://gadm.org/old_versions.html
- AHCB Newberry: https://publications.newberry.org/ahcb/ ; https://publications.newberry.org/ahcb/download/
- AHCB LOC record (CC0): https://www.loc.gov/item/2018487899/
- AHCB commentary: https://publications.newberry.org/ahcb/documents/US_Commentary.htm
- NRCan Territorial Evolution: https://open.canada.ca/data/en/dataset/e88ce995-b69a-4595-a752-bb06b061b5a3
- OGL-Canada: https://open.canada.ca/en/open-government-licence-canada
- ICOW dataset (CC0): https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/E6PSGZ
- COW Territorial Change v6: https://correlatesofwar.org/data-sets/territorial-change/
- ArcGIS Colonial America 1775: https://www.arcgis.com/home/item.html?id=aaf0f38f260c488caf8a2809c6aae5f6
- LOC Pownall 1776 item: https://www.loc.gov/item/74693073/
- LOC Pownall 1776 image: https://tile.loc.gov/storage-services/service/gmd/gmd3/g3300/g3300/ar014300.jp2
- LOC Pownall 1776 IIIF manifest: https://www.loc.gov/item/74693073/manifest.json
- Native Land: https://native-land.ca
- Canada Historic Treaties: https://open.canada.ca/data/en/dataset/f281b150-0645-48e4-9c30-01f55f93f78e
- National Archives Declaration transcription: https://www.archives.gov/founding-docs/declaration-transcript
- David Rumsey: https://www.davidrumsey.com/
- LOC American Revolution maps collection: https://www.loc.gov/collections/american-revolutionary-war-maps/
- Virginia charters/boundaries reference: https://www.virginiaplaces.org/boundaries/charters.html
- UC Berkeley GeoData (Fort Stanwix 1768 map): https://geodata.lib.berkeley.edu/catalog/dd27616e-4b21-491e-ad44-e875cfc30359
- David Rumsey "Original grants 1776" map: https://davidrumsey.com/luna/servlet/detail/RUMSEY~8~1~32671~1152041
- Atlas Pi (historical geography API, commercial, 4500 BCE–2024): referenced via historical-basemaps README — noted as a paid service, not a licensed redistributable dataset; not evaluated as a primary source here.