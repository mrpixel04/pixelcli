import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

// ASCII-art splash shown when a session opens. FIGlet "standard" font.
const ART = [
  " ____  _          _      _ _ ",
  "|  _ \\(_)_  _____| | ___| (_)",
  "| |_) | \\ \\/ / _ \\ |/ __| | |",
  "|  __/| |>  <  __/ | (__| | |",
  "|_|   |_/_/\\_\\___|_|\\___|_|_|",
];

export default function Banner() {
  return (
    <Box flexDirection="column" alignItems="center" marginY={1}>
      {ART.map((line, i) => (
        <Text key={i} color={theme.logo} bold>
          {line}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text color={theme.accent}>by MrFrankis 2026</Text>
      </Box>
      <Text color={theme.faint}>Unit Aplikasi Sokongan</Text>
    </Box>
  );
}
