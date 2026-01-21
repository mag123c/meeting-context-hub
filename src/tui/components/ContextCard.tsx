import { Box, Text } from "ink";
import type { Context, ContextWithSimilarity } from "../../types/context.types.js";

interface ContextCardProps {
  context: Context | ContextWithSimilarity;
  selected?: boolean;
  showSimilarity?: boolean;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function ContextCard({ context, selected, showSimilarity }: ContextCardProps) {
  const similarity = "similarity" in context ? context.similarity : undefined;

  return (
    <Box flexDirection="column" paddingLeft={selected ? 0 : 2}>
      <Box>
        {selected && <Text color="cyan">{"> "}</Text>}
        <Text bold color={selected ? "cyan" : undefined}>
          {truncate(context.summary, 50)}
        </Text>
        {showSimilarity && similarity !== undefined && (
          <Text dimColor> ({Math.round(similarity * 100)}%)</Text>
        )}
      </Box>
      <Box paddingLeft={selected ? 2 : 0}>
        <Text dimColor>
          [{context.type}] {formatDate(context.createdAt)}
          {context.project && ` | ${context.project}`}
          {context.sprint && ` | ${context.sprint}`}
        </Text>
      </Box>
      <Box paddingLeft={selected ? 2 : 0}>
        <Text dimColor>
          Tags: {context.tags.length > 0 ? context.tags.join(", ") : "none"}
        </Text>
      </Box>
    </Box>
  );
}

interface ContextListProps {
  contexts: (Context | ContextWithSimilarity)[];
  selectedIndex: number;
  showSimilarity?: boolean;
}

export function ContextList({ contexts, selectedIndex, showSimilarity }: ContextListProps) {
  return (
    <Box flexDirection="column" gap={1}>
      {contexts.map((context, index) => (
        <ContextCard
          key={context.id}
          context={context}
          selected={index === selectedIndex}
          showSimilarity={showSimilarity}
        />
      ))}
    </Box>
  );
}
