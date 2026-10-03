# The Healthcare Counterfactual

Which molecule decides which company's fate. Life sciences past, present and expected future, from the public record, with a deal simulator that buys real facilities and draws the no-deal path beside the deal.

Live: https://www.abhaychakra.com/p/healthcare/ (simulator: https://www.abhaychakra.com/p/healthcare/sim/)

Built in September 2026 by Abhay Chakra Sadineni.

## What is in it

**The atlas** (repo root):

- **The current (home):** a filament canvas of the 200 largest Medicare drug lines, 2020 to 2024, running through the present to each molecule's expected loss of exclusivity, with device makers above.
- **Molecules, Companies, Pipeline, Future, Devices, Method.**
  - Molecule and company pages show concentration: how much of a maker's Medicare book one molecule carries.
  - Companies includes 57 SEC filers.
  - Pipeline is a heat grid of 12,196 active industry trials by area and modality.
  - Future is the exclusivity calendar, each date marked verified, reported or unverified, plus the Medicare negotiation cycles for 2026, 2027 and 2028.
  - Devices draws on openFDA 510(k), PMA and recall records.

**The deal simulator** (`sim/`):

- **What you can buy:** real nursing homes, hospitals, home health agencies, hospices, physician practice sites or a biopharma pipeline, in a real market.
- **What you can do with it:** lever it, change staffing, sell the property, refinance, divest, close or restructure.
- **What it shows:** the model runs year by year and draws the no-deal path beside the deal, with market concentration, regulatory triggers by state, a value bridge and patient-outcome indices.
- **Biopharma:** Monte Carlo readouts for the pipeline.
- **Calibration:** 42 parameters, each graded A to E with its source and editable.

## What is real and what is synthetic

**The starting data is public record.** Simulator data built 2026-09-15T00:26:53Z:

| Universe | Count | Sources |
|---|---|---|
| Nursing homes | 14,690 | CMS Provider Data Catalog, SNF cost reports FY2023, utilisation 2024, owners, changes of ownership |
| Hospitals | 5,419 | Hospital general information, cost reports, owners, changes of ownership |
| Home health agencies | 8,609 | CMS post-acute geography and provider file, 2024 |
| Hospices | 6,134 | CMS post-acute geography and provider file, 2024 |
| Physician practice sites | 31,704 | CMS Physician and Other Practitioners 2023, six specialties |
| Biopharma sponsors | 3,323 | ClinicalTrials.gov API v2 (12,196 active studies), openFDA Drugs@FDA approvals since 2015 (1,520), Medicare Part B and D spending 2020 to 2024 |

The atlas was built 2026-09-15T03:21:41Z from the same files plus `pipeline/curated.py`. That file holds the exclusivity table (each row marked verified, reported or unverified), the negotiation lists, the CDER novel approvals by year, and the manufacturer to ticker map. `data/lifesci.json` is a snapshot of the daily feed generated 2026-10-03T10:46:07Z: SEC EDGAR for 57 filers, openFDA devices, six FRED series. On abhaychakra.com the page reads the live feed instead.

**The simulation is a model.** Its operating levers, effect sizes and outcome indices are parameters taken from published studies. They are assumptions about what a deal would do, not observations.

## Run it

```
python3 -m http.server 8000
```

Open http://localhost:8000 for the atlas and http://localhost:8000/sim/ for the simulator. The simulator data ships gzip-compressed (`sim/data/*.json.gz`). Browsers with `DecompressionStream`, which is every current browser, decompress it themselves, so any static host works, including GitHub Pages (Settings, Pages, `main` branch, root).

## Rebuilding the data

- **`pipeline/build_atlas.py`** rebuilds `data/atlas.json` from `sim/data/pharma.json.gz`, `sim/data/meta.json.gz`, `data/lifesci.json` and `pipeline/curated.py`. On 3 October 2026 a rerun from this layout reproduced the published atlas. Every section came out identical except the vintage stamp, which records the feed date.
- **`pipeline/lifesci_lambda.py`** is the AWS Lambda that writes the daily feed at 10:45 UTC. The bucket name is set in the file.
- **The simulator's harvest scripts are not included.** The federal files were collected through a browser session in a separate working chat, because the build machine could not reach data.cms.gov or clinicaltrials.gov. The compressed outputs are here; the collection code is not.

## Files

| Path | Role |
|---|---|
| `index.html`, `app.css`, `app.js`, `current.js` | Atlas shell, styles, pages, filament canvas |
| `data/atlas.json`, `data/lifesci.json` | Atlas data and feed snapshot |
| `sim/` | Deal simulator: `engine.js` (deal and evolution model), `sim.js`, `pharma.js`, `charts.js`, `data.js` (loader), `app.js` (interface), `data/*.json.gz` |
| `pipeline/` | Atlas builder, hand-checked tables (`curated.py`), feed Lambda |
| `deploy.sh` | Deploy atlas and simulator to S3 and CloudFront with hashed asset URLs |
| `fonts/` | Manrope, Fraunces, JetBrains Mono (SIL OFL 1.1) |

## Licences

- **Code:** no licence file is included, so default copyright applies (all rights reserved).
- **Data:** CMS, ClinicalTrials.gov, openFDA and SEC EDGAR are United States government works. The FRED series used originate with BEA, BLS and the Federal Reserve.
- **Fonts:** SIL Open Font License 1.1.
