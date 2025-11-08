import { Moon, Sun } from "lucide-react";
import { Dropdown } from "react-bootstrap";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <Dropdown>
      <Dropdown.Toggle
        variant="outline-secondary"
        id="theme-dropdown"
        size="sm"
      >
        <Sun
          className="d-inline-block dark-d-none"
          style={{ width: "1.2rem", height: "1.2rem" }}
        />
        <Moon
          className="d-none dark-d-inline-block"
          style={{ width: "1.2rem", height: "1.2rem" }}
        />
        <span className="visually-hidden">Toggle theme</span>
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        <Dropdown.Item onClick={() => setTheme("light")}>Light</Dropdown.Item>
        <Dropdown.Item onClick={() => setTheme("dark")}>Dark</Dropdown.Item>
        <Dropdown.Item onClick={() => setTheme("system")}>System</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
