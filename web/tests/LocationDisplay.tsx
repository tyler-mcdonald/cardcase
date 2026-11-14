import { useLocation } from "react-router-dom";

export function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}
