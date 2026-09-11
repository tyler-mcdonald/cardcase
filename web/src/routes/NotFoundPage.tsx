import { Button, Container, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container ta="center" py="xl">
      <Title>Something is not right...</Title>
      <Text c="dimmed" size="lg" mt="md">
        Page you are trying to open does not exist. You may have mistyped the
        address, or the page has been moved to another URL. If you think this is
        an error, contact support.
      </Text>
      <Button mt="xl" size="md" onClick={() => navigate("/")}>
        Get back to home page
      </Button>
    </Container>
  );
}
