/**
 * Parse a .env file content into key-value pairs.
 * Ported from the web app's parseEnvFile (app/page.js).
 */
export function parseEnvFile(content) {
  const lines = content.split('\n');
  const parsedKeys = [];
  const warnings = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return;
    }

    if (trimmedLine.startsWith('#')) {
      warnings.push(`Line ${index + 1}: Skipped comment "${trimmedLine.substring(0, 50)}${trimmedLine.length > 50 ? '...' : ''}"`);
      return;
    }

    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) {
      warnings.push(`Line ${index + 1}: Invalid format (no = found) "${trimmedLine.substring(0, 30)}..."`);
      return;
    }

    const name = trimmedLine.substring(0, equalIndex).trim();
    let value = trimmedLine.substring(equalIndex + 1).trim();

    if (value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
         (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }

    if (!name) {
      warnings.push(`Line ${index + 1}: Empty key name`);
      return;
    }

    if (!value) {
      warnings.push(`Line ${index + 1}: Empty value for key "${name}"`);
      return;
    }

    parsedKeys.push({ name, apiKey: value });
  });

  // Deduplicate — keep last occurrence
  const nameCount = {};
  parsedKeys.forEach(pk => {
    nameCount[pk.name] = (nameCount[pk.name] || 0) + 1;
  });
  const internalDuplicates = Object.keys(nameCount).filter(name => nameCount[name] > 1);
  if (internalDuplicates.length > 0) {
    warnings.push(`Duplicate keys in file (last value will be used): ${internalDuplicates.join(', ')}`);
    const seen = new Set();
    const uniqueKeys = [];
    for (let i = parsedKeys.length - 1; i >= 0; i--) {
      if (!seen.has(parsedKeys[i].name)) {
        seen.add(parsedKeys[i].name);
        uniqueKeys.unshift(parsedKeys[i]);
      }
    }
    return { parsedKeys: uniqueKeys, warnings };
  }

  return { parsedKeys, warnings };
}
