export default function decorate(block) {
  const rows = [...block.children];

  if (rows.length < 2) return;

  block.classList.add('two-column');

  const left = document.createElement('div');
  const right = document.createElement('div');

  left.append(...rows[0].childNodes);
  right.append(...rows[1].childNodes);

  block.replaceChildren(left, right);
}
