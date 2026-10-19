# Keep annual reference geometry separate from exact event dates

The NRCan 1949 territorial-evolution layer describes an annual political state, while primary evidence dates Newfoundland's entry to March 31. We retain the annual snapshot contract and record the exact event independently: exact-day requests cannot silently reuse annual geometry, and adjacent snapshots create no interval. This sacrifices continuous playback coverage to avoid claiming temporal precision or effective control that the geometry source does not establish.
