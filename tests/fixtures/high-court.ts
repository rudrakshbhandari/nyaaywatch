import type { HighCourtCaptureBundle } from "../../src/domain/high-court-capture-schema.js";
import type { HighCourtProfile } from "../../src/high-courts.js";

export const BASE_HIGH_COURT_HTML = `
<select class='form-select me-2 w-50' id='state_code' name='state_code'>
  <option value="2~5" selected>High Court of Himachal Pradesh</option>
</select>
<select class='form-select w-50' id='dist_code' name='dist_code'>
  <option value=''>Select Bench</option>
  <option value="1">Principal Bench Fixture</option>
</select>
<h4 class="card-title mb-0 d-inline">Civil Cases</h4><span class="float-end h2 m-0 "> 91,881</span>
<h4 class="card-title mb-0 d-inline">Criminal Cases</h4><span class="float-end h2 m-0 ">13,718</span>
<h4 class="card-title mb-0 d-inline">Total Cases</h4><span class="float-end h2 m-0 "> 1,05,599</span>
<div class="card-header text-center h6"><span style='color: #04624E;font-weight: bold;'>Instituted in last month</span></div>
<table width='100%' cellpadding='0' align='center' class='text-center'>
  <tr>
    <td><span class='h4'><a href="#" onclick="fetchStateData('ins',2);" data-bs-toggle="modal" data-bs-target="#modal_state_data">6,021</a></td>
    <td><span class='h4'><a href="#" onclick="fetchStateData('ins',3);" data-bs-toggle="modal" data-bs-target="#modal_state_data">1,025</a></td>
    <td><span class='h4'><a href="#" onclick="fetchStateData('ins',1);" data-bs-toggle="modal" data-bs-target="#modal_state_data">7,046</a></td>
  </tr>
</table>
<div class="card-header text-center h6"><span style='color: #205E79;font-weight: bold;'>Disposal in last month</span></div>
<table width='100%' cellpadding='0' align='center' class='text-center'>
  <tr>
    <td><span class='h4'><a href="#" onclick="fetchStateData('disp',2);" data-bs-toggle="modal" data-bs-target="#modal_state_data">5,552</a></span></td>
    <td><span class='h4'><a href="#" onclick="fetchStateData('disp',3);" data-bs-toggle="modal" data-bs-target="#modal_state_data">976</a></span></td>
    <td><span class='h4'><a href="#" onclick="fetchStateData('disp',1);" data-bs-toggle="modal" data-bs-target="#modal_state_data">6,528</a></span></td>
  </tr>
</table>
<select name="case_type_gr" id="case_type_gr" class="form-select form-select-sm mt-3">
  <option value="10">All</option>
  <option value="0">Writ Petition</option>
  <option value="1">Second Appeal</option>
</select>
<h6 class="pt-1 fw-bold" style="color:#198754;">Less than one year</h6>
<tr>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot0_1',2);" aria-label="26,806" data-bs-toggle="modal" data-bs-target="#modal_year_data">26,806</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot0_1',3);" aria-label="4,473" data-bs-toggle="modal" data-bs-target="#modal_year_data">4,473</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot0_1',1);" aria-label="31,279 (30%)" data-bs-toggle="modal" data-bs-target="#modal_year_data">31,279 (30%)</span></td>
</tr>
<h6 class="pt-1 fw-bold" style="color:#198754;">1 to 3 Years</h6>
<tr>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot1_3',2);" aria-label="19,056" data-bs-toggle="modal" data-bs-target="#modal_year_data">19,056</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot1_3',3);" aria-label="3,015" data-bs-toggle="modal" data-bs-target="#modal_year_data">3,015</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot1_3',1);" aria-label="22,071 (21%)" data-bs-toggle="modal" data-bs-target="#modal_year_data">22,071 (21%)</span></td>
</tr>
<h6 class="pt-1 fw-bold" style="color:#198754;">3 to 5 Years</h6>
<tr>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot3_5',2);" aria-label="11,482" data-bs-toggle="modal" data-bs-target="#modal_year_data">11,482</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot3_5',3);" aria-label="1,611" data-bs-toggle="modal" data-bs-target="#modal_year_data">1,611</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot3_5',1);" aria-label="13,093 (12%)" data-bs-toggle="modal" data-bs-target="#modal_year_data">13,093 (12%)</span></td>
</tr>
<h6 class="pt-1 fw-bold" style="color:#198754;">5 to 10 Years</h6>
<tr>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot5_10',2);" aria-label="28,070" data-bs-toggle="modal" data-bs-target="#modal_year_data">28,070</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot5_10',3);" aria-label="3,336" data-bs-toggle="modal" data-bs-target="#modal_year_data">3,336</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('tot5_10',1);" aria-label="31,406 (30%)" data-bs-toggle="modal" data-bs-target="#modal_year_data">31,406 (30%)</span></td>
</tr>
<h6 class="pt-1 fw-bold" style="color:#198754;">Above 10 Years</h6>
<tr>
  <td><span class="h4"><a href="#" onclick="fetchYearData('above_10',2);" aria-label="6,467" data-bs-toggle="modal" data-bs-target="#modal_year_data">6,467</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('above_10',3);" aria-label="1,283" data-bs-toggle="modal" data-bs-target="#modal_year_data">1,283</span></td>
  <td><span class="h4"><a href="#" onclick="fetchYearData('above_10',1);" aria-label="7,750 (7%)" data-bs-toggle="modal" data-bs-target="#modal_year_data">7,750 (7%)</span></td>
</tr>
<p>Last Reviewed and Updated on : </p>
<p class="text-white rounded p-1">S3</p>
<p class="text-white rounded p-1">Version :2.0</p>
`;

export function buildHighCourtCaptureBundle(
  profile: Pick<HighCourtProfile, "courtCode" | "courtSlug" | "courtName" | "coveredGeographies" | "hcNjdgStateValue" | "sourceUrls">,
  capturedAt = "2026-04-19T00:00:00.000Z",
): HighCourtCaptureBundle {
  const html = BASE_HIGH_COURT_HTML.replace('value="2~5" selected>High Court of Himachal Pradesh', `value="${profile.hcNjdgStateValue}" selected>${profile.courtName}`);

  return {
    capturedAt,
    courtCode: profile.courtCode,
    courtSlug: profile.courtSlug,
    courtName: profile.courtName,
    coveredGeographies: profile.coveredGeographies,
    sourceName: `HC NJDG ${profile.courtName} dashboard`,
    sourceAttribution: `High Courts of India National Judicial Data Grid for ${profile.courtName}`,
    homePage: {
      url: `${profile.sourceUrls.hcNjdg}?p=home&state_code=${profile.hcNjdgStateValue}`,
      html,
    },
    benchOptions: [{ benchCode: "1", benchName: "Principal Bench Fixture" }],
  };
}

export function buildHimachalHighCourtCaptureBundle(
  capturedAt = "2026-04-19T00:00:00.000Z",
): HighCourtCaptureBundle {
  return buildHighCourtCaptureBundle(
    {
      courtCode: "HPHC",
      courtSlug: "himachal",
      courtName: "High Court of Himachal Pradesh",
      coveredGeographies: [
        {
          geographyCode: "HP",
          geographyName: "Himachal Pradesh",
          geographyType: "state",
          lowerCourtStateCode: "HP",
        },
      ],
      hcNjdgStateValue: "2~5",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
      },
    },
    capturedAt,
  );
}
