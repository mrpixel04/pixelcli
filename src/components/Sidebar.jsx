import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

function truncate(s, n) {
  if (n <= 1) return '…';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// Left column: the project path and a read-only file tree of the working dir.
// A single right border acts as the divider between the sidebar and the chat.
export default function Sidebar({ cwd, tree, width }) {
  return (
    <Box
      width={width}
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.line}
      borderTop={false}
      borderBottom={false}
      borderLeft={false}
      paddingX={1}
    >
      <Text color={theme.logo} bold wrap="truncate">
        project
      </Text>
      <Text color={theme.faint} wrap="truncate-start">
        {cwd}
      </Text>

      <Box marginTop={1} flexDirection="column">
        {tree.length === 0 ? (
          <Text color={theme.faint}>(empty)</Text>
        ) : (
          tree.map((n, i) => (
            <Text
              key={`${n.depth}:${n.name}:${i}`}
              color={n.isDir ? theme.accent : theme.text}
              wrap="truncate-end"
            >
              {'  '.repeat(n.depth)}
              {n.isDir ? '▸ ' : '· '}
              {truncate(n.name, 24 - n.depth * 2)}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}
