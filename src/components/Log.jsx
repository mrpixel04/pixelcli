import React from 'react';
import { Box, Text } from 'ink';
import { theme, providerColor } from '../theme.js';
import { collapseCode } from '../display.js';

function Turn({ turn }) {
  if (turn.role === 'user') {
    return (
      <Box marginTop={1}>
        <Text color={theme.accent}>{'› '}</Text>
        <Text>{turn.content}</Text>
      </Box>
    );
  }

  if (turn.role === 'assistant') {
    const accent = providerColor[turn.provider] ?? theme.accent;
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text>
          <Text color={accent}>{'● '}</Text>
          <Text color={theme.faint}>{turn.model}</Text>
        </Text>
        {turn.content ? (
          <Text>{collapseCode(turn.content)}</Text>
        ) : (
          <Text color={theme.faint}>…</Text>
        )}
      </Box>
    );
  }

  // system / notice
  const color = turn.tone === 'error' ? theme.error : theme.system;
  return (
    <Box marginTop={1}>
      <Text color={color}>{turn.content}</Text>
    </Box>
  );
}

export default function Log({ turns }) {
  return (
    <Box flexDirection="column" paddingX={1}>
      {turns.map((t) => (
        <Turn key={t.id} turn={t} />
      ))}
    </Box>
  );
}
