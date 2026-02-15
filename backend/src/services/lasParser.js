function parseLasFile(fileContent) {
  const lines = fileContent.split('\n');

  const result = {
    version: {},
    well: {},
    curves: [],
    data: [],
  };

  let currentSection = null;
  const curveNames = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('~')) {
      const sectionChar = line.charAt(1).toUpperCase();
      if (sectionChar === 'V') {
        currentSection = 'version';
      } else if (sectionChar === 'W') {
        currentSection = 'well';
      } else if (sectionChar === 'C') {
        currentSection = 'curves';
      } else if (sectionChar === 'A') {
        currentSection = 'data';
      } else {
        currentSection = null;
      }
      continue;
    }

    if (currentSection === 'version' || currentSection === 'well') {
      const parsed = parseHeaderLine(line);
      if (parsed) {
        result[currentSection][parsed.mnemonic] = {
          unit: parsed.unit,
          value: parsed.value,
          description: parsed.description,
        };
      }
    }

    if (currentSection === 'curves') {
      const parsed = parseHeaderLine(line);
      if (parsed) {
        curveNames.push(parsed.mnemonic);
        result.curves.push({
          mnemonic: parsed.mnemonic,
          unit: parsed.unit,
          description: parsed.description,
          index: result.curves.length,
        });
      }
    }

    if (currentSection === 'data') {
      const values = line.split(/\s+/).map(Number);
      if (values.length === curveNames.length && !values.some(isNaN)) {
        const row = {};
        curveNames.forEach((name, i) => {
          row[name] = values[i];
        });
        result.data.push(row);
      }
    }
  }

  return result;
}

function parseHeaderLine(line) {
  const match = line.match(/^([^.]+)\.\s*(\S*)\s+(.*?)\s*:\s*(.*)$/);
  if (!match) return null;

  return {
    mnemonic: match[1].trim(),
    unit: match[2].trim(),
    value: match[3].trim(),
    description: match[4].trim(),
  };
}

module.exports = { parseLasFile };
