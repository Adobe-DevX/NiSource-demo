# Two Column

Lightweight two-column layout block for placing two pieces of authored content side-by-side.

## Authoring fields

- `classes` — layout option (`Default`, `Stack on mobile`)
- `left_content` — rich text rendered in the left column
- `right_content` — rich text rendered in the right column

## Notes

- Uses CSS Grid for the layout. Both columns get `min-width: 0` so long content (links, images) can shrink.
- Below 768px viewport width, columns stack to a single column.
