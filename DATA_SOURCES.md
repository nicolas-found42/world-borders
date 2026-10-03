# Data attribution and limitations

The application code is licensed GPL-3.0-only. Bundled data is separately licensed
as listed below. No CShapes or other noncommercial-only data is a required part of
this bundle. UI icons are provided by lucide-react; locally served fonts come from
Fontsource (DM Sans and Manrope, SIL Open Font License).

## Historical Basemaps

- Author: André Ourednik and upstream contributors. Preserve the full credits in
  the [upstream project](https://github.com/aourednik/historical-basemaps).
- License: [GPL-3.0](https://github.com/aourednik/historical-basemaps/blob/master/LICENSE).
- Files: `snapshot-1880.geojson` (US, Mexico, Hawaii), `snapshot-1938.geojson`,
  `snapshot-1960.geojson`, `snapshot-2010.geojson`.
- Modifications: geographic/polity selection for the pilot; compact properties;
  common identity/color metadata;
  official replacement of the 1880 Canada and Newfoundland polygons.
- Coordinates are generalized world/continent-scale reference shapes. The
  upstream precision field is not treated as independent evidence of accuracy.
  These reference shapes are not a verified effective-control dataset.

## Natural Resources Canada

- Dataset: [Territorial Evolution of Canada, 1867 to 2003](https://open.canada.ca/data/dataset/e88ce995-b69a-4595-a752-bb06b061b5a3).
- Author: Natural Resources Canada / Government of Canada.
- License: [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada).
- Service: [Political Divisions, layer 8](https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/territorial_evolution_en/MapServer/8).
- Files: Canada/Newfoundland in `snapshot-1880.geojson` and Canada in `snapshot-1949.geojson`.
- Modifications: query the 1880 records in EPSG:4326; request 0.03-degree server
  simplification; dissolve provincial divisions within each political grouping;
  add display/source metadata. This is generalized official historical geometry,
  not a survey-grade boundary or an assertion about day-by-day control.
- For 1949: request all fourteen divisions without service simplification
  (`maxAllowableOffset=0`), dissolve the national outline, then simplify rings
  at 0.03 degrees using Douglas–Peucker and retained boundary points. Small
  rings remain intact. Simplifying provinces separately created seams and was rejected.
- The 1949 snapshot is an annual post-entry **legal-affiliation reference**,
  including Newfoundland/Labrador. US/Mexico remain unavailable. It is not
  effective-control reconstruction, independently validated boundaries, a
  full-year interval or March 31 day-valid geometry.
- Contains information licensed under the Open Government Licence – Canada.
- This application is not endorsed by the Government of Canada.

## Natural Earth

- Authors: Natural Earth contributors.
- License: [Public domain](https://www.naturalearthdata.com/about/terms-of-use/).
- File: `land.geojson`, from the 1:110 million physical land layer.
- Modern physical land is neutral context, with no sovereignty implications.
  Historic rivers and coastlines are not reconstructed.

## Independent ownership checks

- Evidence: US National Archives, [Joint Resolution to Provide for Annexing the
  Hawaiian Islands to the United States (1898)](https://www.archives.gov/milestone-documents/joint-resolution-for-annexing-the-hawaiian-islands).
- This primary document supports checking Hawaii is outside the US in 1880 and
  inside it in 1938. It is not the source for the island polygon coordinates.
- Parks Canada, [Newfoundland's Entry into Confederation](https://parks.canada.ca/culture/designation/evenement-event/terre-neuve-confederation-newfoundland), supports checking Newfoundland is separate in 1880 and 1938, and Canadian in 1960 and 2010.

## Excluded snapshots

- 1783, 1800 and 1815: polygon containment puts Jacksonville within the US before
  the [1821 Florida transfer](https://history.state.gov/milestones/1801-1829/florida).
- 1815 and 1900: polygon containment puts Newfoundland within Canada before 1949.
- Exclusion is conservative: small checks reveal demonstrable errors; they do not
  locate every error or license replacing whole boundaries with guesses.

## Provenance

`public/data/manifest.json` records every original geometry input URL and SHA-256
hash, corrections, source licenses and coverage. Original downloads are kept in
an ignored local cache. The distributed GeoJSON contains the actual coordinate
arrays used by the renderer; its winding adapter preserves those points.

Snapshot files describe only the selected calendar year. No validity interval is
inferred from spacing between snapshots. Coverage from 1776 through the present,
fully vetted geometry, effective-control reconstruction and dispute overlays are
not yet complete.

## Publication disposition and research

The owner authorized bounded reference review and an explicit 1776 gap. The
[Canada1949 disposition](data/curation/canada-1949.json) binds approval to the exact
source SHA-256; changed inputs, unknown licensing or unresolved conflicts require
new review. Reference approval does not confer independently verified status.
The [research](research/HISTORICAL_SLICE_RESEARCH.md),
[initial Jev ledger](research/jev-historical-slice-records.json) and
[Labrador extent ledger](research/jev-labrador-review-records.json) retain cited
passages, hashes, real judgments and held outcomes. The
[Terms of Union](https://www.legislation.gov.uk/ukpga/Geo6/12-13-14/22/enacted)
establish legal affiliation and the 1927 extent; the separately recorded March 31
event does not validate polygon coordinates. The Declaration supplies no 1776
polygons; neither 1715 nor 1783 is backcast to fill the gap.

The Canada 1949 curator record binds both raw input and the proposed publication scope by SHA-256. Changing time, representation, coverage, limitations, evidence or transformation requires renewed review even when upstream geometry is unchanged.
