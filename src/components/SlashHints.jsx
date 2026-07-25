import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

// Inline slash-command suggestions shown under the chat input while the user is
// typing a `/command`. The top match is highlighted; Tab completes to it.
export default function SlashHints({ items }) {
  return (
    <Box flexDirection="column" marginX={1} paddingX={1}>
      {items.map((c, i) => (
        <Box key={c.id}>
          <Text color={i === 0 ? theme.accent : theme.faint}>{i === 0 ? '› ' : '  '}</Text>
          <Text color={i === 0 ? theme.accent : theme.text} bold={i === 0}>
            {c.label}
          </Text>
          <Text color={theme.faint}>
            {'  '}
            {c.tag}
          </Text>
        </Box>
      ))}
      <Text color={theme.faint}>tab to complete · ⏎ to run</Text>
    </Box>
  );
}
