import React from 'react';
import { Box, Text } from 'ink';
import { theme, providerColor } from '../theme.js';
import { VERSION } from '../meta.js';

export default function Header({ cwd, branch, model, provider, ready }) {
  const accent = providerColor[provider] ?? theme.accent;
  return (
    <Box justifyContent="space-between" paddingX={1}>
      <Text>
        <Text color={theme.logo} bold>
          ◆ pixelcli
        </Text>
        <Text color={theme.faint}> v{VERSION}</Text>
      </Text>
      <Text>
        <Text color={theme.faint}>{cwd}</Text>
        {branch ? <Text color={theme.faint}> {'⎇'} {branch}</Text> : null}
        <Text color={ready ? accent : theme.faint}> {'●'} </Text>
        <Text color={accent}>{model}</Text>
      </Text>
    </Box>
  );
}
