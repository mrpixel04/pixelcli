import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

// Inline slash-command suggestions shown under the chat input while the user is
// typing a `/command`. The top match is highlighted; Tab completes to it.
export default function SlashHints({ items, index = 0 }) {
  const active = Math.min(index, items.length - 1);
  return (
    <Box flexDirection="column" marginX={1} paddingX={1}>
      {items.map((c, i) => (
        <Box key={c.id}>
          <Text color={i === active ? theme.accent : theme.faint}>{i === active ? '› ' : '  '}</Text>
          <Text color={i === active ? theme.accent : theme.text} bold={i === active}>
            {c.label}
          </Text>
          <Text color={theme.faint}>
            {'  '}
            {c.tag}
          </Text>
        </Box>
      ))}
      <Text color={theme.faint}>↑↓ move · tab complete · ⏎ select</Text>
    </Box>
  );
}
