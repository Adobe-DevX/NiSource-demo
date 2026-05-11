# Two Column

Container block that lays out a fixed two-column grid. Each column is a Universal Editor cell that authors can populate with any allowed block (e.g. `bill-card`, `teaser`, `billing-payment`, default content).

## Authoring fields

- `classes` — layout option (`Default`, `Stack on mobile`)

## Authoring model

- Built on the `core/franklin/components/columns/v1/columns` resource type, locked to 2 columns × 1 row.
- Children are restricted to `column` cells; the `column` filter (in `component-filters.json`) controls which blocks may be dropped into each cell.

## Notes

- The decorator flattens the row + cells into direct children, so the CSS targets `.two-column > div` for each column.
- Below 768px viewport width, the two columns stack vertically.
