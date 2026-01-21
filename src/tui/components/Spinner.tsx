import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import { useTranslation } from "../../i18n/index.js";

interface SpinnerProps {
  message?: string;
}

export function Spinner({ message }: SpinnerProps) {
  const { t } = useTranslation();
  return (
    <Box>
      <Text color="cyan">
        <InkSpinner type="dots" />
      </Text>
      <Text> {message ?? t.common.loading}</Text>
    </Box>
  );
}
