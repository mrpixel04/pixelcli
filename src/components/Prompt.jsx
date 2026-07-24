import React from 'react';
import { Text } from 'ink';
import { theme } from '../theme.js';

// Pure renderer for the input line. All key handling lives in app.jsx's single
// useInput — this component only draws value + cursor.
export default function Prompt({ value, cursor, placeholder }) {
  if (!value) {
    return (
      <Text>
        <Text inverse> </Text>
        <Text color={theme.faint}>{placeholder}</Text>
      </Text>
    );
  }
  const before = value.slice(0, cursor);
  const at = value[cursor] ?? ' ';
  const after = value.slice(cursor + 1);
  return (
    <Text>
      {before}
      <Text inverse>{at}</Text>
      {after}
    </Text>
  );
}
