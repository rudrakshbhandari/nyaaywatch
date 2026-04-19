import type { SupremeCourtCaptureBundle } from "../../src/domain/supreme-court-capture-schema.js";

export const BASE_SUPREME_COURT_HTML = `
<div>
  <h4>At a Glance</h4>
  <h4 class="card-title mb-0 d-inline">Appeal (C)</h4>
  <div>Registered Cases</div>
  <h4>54949</h4>
  <div>Unregistered Cases</div>
  <h4>17934</h4>
  <div>Listed Matters</div>
  <h5>9617</h5>
  <div>Under Scrutiny / Defective / Pending for Listing</div>
  <h5>8317</h5>
  <h4>Pending Civil Cases</h4>
  72883
  <div>Registered Cases</div>
  <h4>15402</h4>
  <div>Unregistered Cases</div>
  <h4>3960</h4>
  <div>Listed Matters</div>
  <h5>1516</h5>
  <div>Under Scrutiny / Defective / Pending for Listing</div>
  <h5>2444</h5>
  <h4>Pending Criminal Cases</h4>
  19362
  <div>Registered Cases</div>
  <h4>70351</h4>
  <div>Unregistered Cases</div>
  <h4>21894</h4>
  <div>Listed Matters</div>
  <h5>11133</h5>
  <div>Under Scrutiny / Defective / Pending for Listing</div>
  <h5>10761</h5>
  <h4>Total Pending Cases</h4>
  92245
  <div>Instituted in last month</div>
  <p>Instituted in last month civil cases 4,502 Instituted in last month criminal cases 2,136 Instituted in last month total cases 6,638</p>
  <div>Disposal in last month</div>
  <p>Disposal in last month civil cases 2,970 Disposal in last month criminal cases 1,765 Disposal in last month total cases 4,735</p>
  <div>Instituted in current year</div>
  <p>Instituted in current year civil cases 1,225 Instituted in current year criminal cases 567 Instituted in current year total cases 1,792</p>
  <div>Disposal in current year</div>
  <p>Disposal in current year civil cases 1,004 Disposal in current year criminal cases 636 Disposal in current year total cases 1,640</p>
</div>
`;

export function buildSupremeCourtCaptureBundle(
  capturedAt = "2026-04-19T00:00:00.000Z",
  html = BASE_SUPREME_COURT_HTML,
): SupremeCourtCaptureBundle {
  return {
    capturedAt,
    courtCode: "SCI",
    courtSlug: "supreme-court",
    courtName: "Supreme Court of India",
    sourceName: "Supreme Court NJDG dashboard",
    sourceAttribution: "Supreme Court of India National Judicial Data Grid",
    homePage: {
      url: "https://scdg.sci.gov.in/scnjdg/",
      html,
    },
  };
}
