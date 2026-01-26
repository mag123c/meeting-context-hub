import React from 'react';
import { Box, Text } from 'ink';

export interface SectionBoxProps {
  title?: string;
  color?: string;
  borderStyle?: 'single' | 'round' | 'bold' | 'double' | 'singleDouble' | 'doubleSingle' | 'classic';
  children: React.ReactNode;
  marginY?: number;
  paddingX?: number;
}

/**
 * A reusable box component with consistent border styling for sections.
 *
 * Usage:
 * ```tsx
 * <SectionBox title="Decisions" color="green">
 *   {decisions.map(d => <Text key={d}>• {d}</Text>)}
 * </SectionBox>
 * ```
 */
export function SectionBox({
  title,
  color = 'gray',
  borderStyle = 'round',
  children,
  marginY = 1,
  paddingX = 1,
}: SectionBoxProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle={borderStyle}
      borderColor={color}
      marginY={marginY}
      paddingX={paddingX}
    >
      {title && (
        <Text bold color={color}>
          {title}
        </Text>
      )}
      {children}
    </Box>
  );
}
