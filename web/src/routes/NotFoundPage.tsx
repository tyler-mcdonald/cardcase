import { Button, Container, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container ta="center" py="xl">
      <Title>404: Not Found</Title>
      <Text c="dimmed" size="lg" mt="md">
        The page you requested doesn't exist.
      </Text>
      <Button mt="xl" size="md" onClick={() => navigate("/")}>
        Go to Home Page
      </Button>
    </Container>
  );
}
