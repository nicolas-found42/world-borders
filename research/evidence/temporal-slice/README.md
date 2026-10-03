# Temporal slice execution evidence

The matched `before-1949.png` / `after-1949.png` captures use the same application revision, camera, and 1440 × 950 viewport. Only served data changes: before uses the original four assets with their manifest migrated to schema 2; after uses the reviewed five-snapshot bundle. Before shows the 1949 gap; after shows the partial Canada legal-affiliation reference. Data readiness was asserted before each capture. These captures do not establish historical accuracy.

`retained-1938.png` shows the baseline ownership state in the new viewer. All original four snapshot GeoJSON files remain byte-identical. The desktop source panel and 390 × 844 mobile captures show the actual ready 1949 state, coverage/precision, and curator details.

The release checks cover 40 deterministic cases, 11 Chromium browser cases, cached byte-for-byte rebuild, and the 660,000-byte compressed JavaScript budget. CI and deployed revision evidence are linked from the delivery PR. Source inspection and curator scope are recorded in `research/HISTORICAL_SLICE_RESEARCH.md`, the Jev ledgers, and `data/curation/canada-1949.json`.
