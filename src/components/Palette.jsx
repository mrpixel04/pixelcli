import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

// Keep a bounded window of rows visible around the selection so a long model
// list never runs off the terminal.
const WINDOW = 8;

function windowed(items, index) {
  if (items.length <= WINDOW) return { rows: items, offset: 0 };
  let start = Math.max(0, index - Math.floor(WINDOW / 2));
  start = Math.min(start, items.length - WINDOW);
  return { rows: items.slice(start, start + WINDOW), offset: start };
}

export default function Palette({ prompt, query, items, index, footer }) {
  const { rows, offset } = windowed(items, index);
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.line}
      paddingX={1}
      marginX={1}
    >
      <Text>
        <Text color={theme.accent}>{prompt} </Text>
        <Text>{query}</Text>
        <Text color={theme.cursor}>▏</Text>
      </Text>

      {items.length === 0 ? (
        <Text color={theme.faint}>no matches</Text>
      ) : (
        rows.map((it, i) => {
          const active = offset + i === index;
          return (
            <Box key={it.id}>
              <Text color={active ? theme.accent : theme.faint}>{active ? '› ' : '  '}</Text>
              <Text color={it.color ?? theme.text} bold={active}>
                {it.label}
              </Text>
              {it.tag ? <Text color={theme.faint}>{'  '}{it.tag}</Text> : null}
            </Box>
          );
        })
      )}

      <Text color={theme.faint}>{footer}</Text>
    </Box>
  );
}
