# NiSource Footer

Compact site footer for NiSource pages. The block renders a full-width dark footer shell with centered legal links, an optional brand line, and a copyright line.

## Authoring Fields

- `legal`: Rich text for the inline legal navigation row. Links are preserved and rendered inside a footer `nav`.
- `copyright`: Plain text copyright line. If omitted, the block uses the current year with the default SEW AI copyright text.
- `brand`, `brand-line`, or `company`: Optional plain text brand line. If omitted, the block uses the default brand label.

The model also contains legacy column title/body fields. The compact footer implementation currently ignores those fields.

## Behavior

- The block reads key-value authoring rows and preserves rich text markup for `legal`.
- Empty `legal` content falls back to default Contact Us, Terms and Conditions, and Privacy Policy links.
- Link interactions keep the compact footer color treatment and use the shared NiSource focus-ring token for keyboard focus.
- The footer is styled to span the full page width while keeping content centered within the standard 1200px content area.

## Error Handling

- Missing or empty fields fall back to safe defaults.
- Rich text length checks use `DOMParser` when available and fall back to stripping tags if parsing fails.
