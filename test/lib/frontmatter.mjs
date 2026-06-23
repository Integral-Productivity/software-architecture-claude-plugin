// Minimal YAML-frontmatter reader for the plugin's authored markdown.
//
// This is deliberately NOT a full YAML parser. It handles only the subset
// the plugin actually uses in skill/command/agent frontmatter:
//   - inline scalars            (name: foo, model: sonnet)
//   - folded / literal blocks   (description: >  ... , description: | ...)
//   - inline comma lists        (tools: Read, Grep, Glob)
// That is enough to assert "required key is present and non-empty" without
// pulling in a dependency, which keeps `npm test` dependency-free per the
// IP node:test convention.

/**
 * Parse the leading `--- ... ---` frontmatter block of a markdown string.
 *
 * @param {string} content full file text
 * @returns {{ ok: boolean, reason?: string, values: Map<string,string> }}
 *   `ok` is false (with a `reason`) when the delimiters are missing or
 *   malformed. `values` maps each top-level key to its trimmed value
 *   (block scalars are joined with newlines, then trimmed).
 */
export function parseFrontmatter(content) {
  const lines = content.split(/\r?\n/);
  const values = new Map();

  if (lines[0]?.trim() !== '---') {
    return { ok: false, reason: 'missing opening --- delimiter', values };
  }

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return { ok: false, reason: 'missing closing --- delimiter', values };
  }

  let currentKey = null;
  let blockLines = [];
  const flush = () => {
    if (currentKey !== null) {
      values.set(currentKey, blockLines.join('\n').trim());
    }
  };

  for (const line of lines.slice(1, end)) {
    // A top-level key starts at column 0 (no leading whitespace).
    const keyMatch = /^([A-Za-z][\w-]*):(.*)$/.exec(line);
    if (keyMatch && !/^\s/.test(line)) {
      flush();
      currentKey = keyMatch[1];
      const inline = keyMatch[2].trim();
      // `>`, `|`, `>-`, `|-`, or empty all mean "value continues on the
      // following indented lines" — start an empty block in that case.
      const isBlockIndicator = /^[>|][-+]?$/.test(inline) || inline === '';
      blockLines = isBlockIndicator ? [] : [inline];
    } else if (currentKey !== null) {
      // Continuation line of a block scalar.
      blockLines.push(line.trim());
    }
  }
  flush();

  return { ok: true, values };
}

/**
 * Assert that every required key exists and has a non-empty value.
 *
 * @param {Map<string,string>} values from {@link parseFrontmatter}
 * @param {string[]} required key names
 * @returns {string[]} list of human-readable problems (empty = all good)
 */
export function missingFields(values, required) {
  const problems = [];
  for (const key of required) {
    if (!values.has(key)) {
      problems.push(`missing '${key}:'`);
    } else if (values.get(key).length === 0) {
      problems.push(`'${key}:' is present but empty`);
    }
  }
  return problems;
}
