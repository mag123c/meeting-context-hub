import { Box, Text } from "ink";
import { useTranslation } from "../../i18n/index.js";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  const { t } = useTranslation();
  return (
    <Box marginY={1}>
      <Text color="red" bold>
        {t.errors.prefix} {message}
      </Text>
    </Box>
  );
}
