import React from 'react';
import { Box, Text } from 'ink';
import { theme, providerColor } from '../theme.js';

export default function AuthPanel({ rows, index, entering, draft }) {
  const active = rows[index];
  return (
    <Box flexDirection="column" paddingX={1} marginTop={1}>
      <Text color={theme.faint}>
        api keys — ↑↓ move · ⏎ {entering ? 'save' : 'set key'} · d delete · esc back
      </Text>

      <Box marginTop={1} flexDirection="column">
        {rows.map((r, i) => (
          <Box key={r.provider}>
            <Text color={i === index ? theme.accent : theme.faint}>
              {i === index ? '› ' : '  '}
            </Text>
            <Text color={providerColor[r.provider] ?? theme.text}>
              {r.provider.padEnd(11)}
            </Text>
            {r.ready ? (
              <Text color={theme.ok}>
                {r.masked} <Text color={theme.faint}>({r.source})</Text>
              </Text>
            ) : (
              <Text color={theme.faint}>not set</Text>
            )}
          </Box>
        ))}
      </Box>

      {entering && active ? (
        <Box
          marginTop={1}
          borderStyle="round"
          borderColor={theme.line}
          paddingX={1}
        >
          <Text color={theme.accent}>{active.provider} key › </Text>
          <Text>{'•'.repeat(draft.length)}</Text>
          <Text color={theme.cursor}>▏</Text>
        </Box>
      ) : null}
    </Box>
  );
}
