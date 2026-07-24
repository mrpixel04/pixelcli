import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

export default function StatusLine({ mode, sent, received, busy }) {
  return (
    <Box justifyContent="space-between" paddingX={1}>
      <Text>
        <Text backgroundColor={theme.accent} color="black">
          {' '}
          {mode}
          {' '}
        </Text>
        <Text color={theme.faint}>
          {'  tok ⇡'}
          {sent}
          {' ⇣'}
          {received}
        </Text>
        {busy ? <Text color={theme.warn}>{'  … streaming'}</Text> : null}
      </Text>
      <Text color={theme.faint}>^o model · ^p commands · ^r stop · ^c quit</Text>
    </Box>
  );
}
