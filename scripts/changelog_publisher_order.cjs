// Embedded verbatim (excluding module.exports) in the Teable changelog publisher.
// Keep the publisher copy and this tested source in sync when changing it.

function changelogDateKey(label) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  const english = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/.exec(label);
  if (!iso && !english) throw new Error(`Unsupported changelog date: ${label}`);
  const [year, month, day] = iso
    ? iso.slice(1).map(Number)
    : [Number(english[3]), months.indexOf(english[1]) + 1, Number(english[2])];
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
    throw new Error(`Invalid changelog date: ${label}`);
  }
  return parsed.getTime();
}

function sortChangelogUpdates(source) {
  const blocks = [...source.matchAll(/^<Update\b[^>]*>[\s\S]*?^<\/Update>[ \t]*/gm)];
  if (!blocks.length || blocks.length !== (source.match(/<Update\b/g) || []).length ||
      blocks.length !== (source.match(/<\/Update\s*>/g) || []).length) {
    throw new Error('Missing or malformed changelog Update blocks');
  }
  for (let i = 0; i < blocks.length - 1; i++) {
    const gap = source.slice(blocks[i].index + blocks[i][0].length, blocks[i + 1].index);
    if (gap.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').trim()) {
      throw new Error('Unexpected content between changelog Update blocks');
    }
  }
  const entries = blocks.map((block) => {
    const opening = block[0].slice(0, block[0].indexOf('>'));
    const label = /\blabel\s*=\s*(["'])(.*?)\1/.exec(opening);
    if (!label) throw new Error('Changelog Update has no literal date label');
    return { text: block[0], date: changelogDateKey(label[2]) };
  });
  // Stable sort retains the editorial order of separate updates on the same day.
  entries.sort((left, right) => right.date - left.date);
  let result = source.slice(0, blocks[0].index);
  entries.forEach((entry, index) => {
    const end = index + 1 < blocks.length ? blocks[index + 1].index : source.length;
    result += entry.text + source.slice(blocks[index].index + blocks[index][0].length, end);
  });
  return result;
}

function upsertChangelogByDate(fileContent, label, newEntry) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existingEntry = new RegExp(`\\n{0,2}<Update\\s+label="${escapedLabel}">[\\s\\S]*?<\\/Update>\\n?`);
  if (existingEntry.test(fileContent)) {
    // A function replacement keeps literal $ sequences in the changelog intact.
    return sortChangelogUpdates(fileContent.replace(existingEntry, () => `\n\n${newEntry}\n`));
  }
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/.exec(fileContent);
  if (!frontmatter) throw new Error('Changelog frontmatter not found');
  const insertPos = frontmatter[0].length;
  return sortChangelogUpdates(fileContent.slice(0, insertPos) + '\n\n' + newEntry + '\n' + fileContent.slice(insertPos));
}

module.exports = { changelogDateKey, sortChangelogUpdates, upsertChangelogByDate };
