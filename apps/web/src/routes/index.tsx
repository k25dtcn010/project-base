import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
  return (
    <div className="container py-3">
      <div className="row">
        <div className="col-12">
          <pre className="overflow-auto" style={{ fontSize: "0.875rem" }}>
            {TITLE_TEXT}
          </pre>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-12">
          <section className="border rounded p-4">
            <h2 className="mb-2 fw-medium">API Status</h2>
          </section>
        </div>
      </div>
    </div>
  );
}
