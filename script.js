/* globals bootstrap */
import { render, html } from "https://cdn.jsdelivr.net/npm/lit-html@3/+esm";
import { parse } from "https://cdn.jsdelivr.net/npm/partial-json@0.1.7/+esm";
import { SSE } from "https://cdn.jsdelivr.net/npm/sse.js@2";
import { num } from "https://cdn.jsdelivr.net/npm/@gramex/ui@0.3/dist/format.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let app = "author-contracts";

const { token } = await fetch("https://llmfoundry.straive.com/token", { credentials: "include" }).then((res) =>
  res.json(),
);
const url = "https://llmfoundry.straive.com/login?" + new URLSearchParams({ next: location.href });
render(
  token
    ? html`<button type="submit" class="btn btn-primary mt-3">Analyze</button>`
    : html`<a class="btn btn-primary" href="${url}">Log in to try your own images</a></p>`,
  document.querySelector("#analyze"),
);

const $resultTable = document.querySelector("#result-table");
const $analysisTable = document.querySelector("#analysis-table");
const $termsTable = document.querySelector("#terms-table");
const $contractForm = document.querySelector("#contract-form");
const $contractFile = document.querySelector("#contract-file");
const $contract = document.querySelector("#contract");
const $terms = document.querySelector("#terms");
const $snippetModal = document.querySelector("#snippet-modal");
const $snippetModalTitle = document.querySelector("#snippet-modal-title");
const $snippetModalBody = document.querySelector("#snippet-modal-body");

render(html`<div class="text-center"><div class="spinner-border my-5" role="status"></div></div>`, $resultTable);
render(html`<div class="text-center"><div class="spinner-border my-5" role="status"></div></div>`, $termsTable);

const analysis = await fetch(`${app}/analysis.json`).then((r) => r.json());
const docs = Object.keys(analysis.matches);
const terms = analysis.terms;
const termsCount = terms.map((term) => ({
  term,
  count: Object.values(analysis.matches).filter((row) => row[term]).length,
}));
const matches = analysis.matches;

render(
  html`<table class="table table-sm table-hover w-auto mx-auto">
    <thead>
      <tr>
        <th scope="col" class="text-end">#</th>
        <th scope="col">Term</th>
        <th scope="col" colspan="2" class="text-end">Count</th>
      </tr>
    </thead>
    <tbody>
      ${termsCount.map(
        ({ term, count }, index) =>
          html`<tr>
            <td class="text-end">${index + 1}</td>
            <td>${term}</td>
            <td>
              <div
                class="progress mt-1"
                role="progressbar"
                aria-label="Has ${count} of ${docs.length} terms"
                aria-valuenow="${count}"
                aria-valuemin="0"
                aria-valuemax="${docs.length}"
                style="width: 100px"
              >
                <div
                  class="progress-bar ${count > 0.9 * docs.length
                    ? "bg-success"
                    : count > 0.5 * docs.length
                      ? "bg-warning"
                      : "bg-danger"}"
                  style="width: ${(count / docs.length) * 100}%"
                ></div>
              </div>
            </td>
            <td class="text-end">${count} / ${docs.length}</td>
          </tr>`,
      )}
    </tbody>
  </table>`,
  $termsTable,
);

render(
  html`
    <table class="table table-sm table-hover w-auto mx-auto">
      <thead>
        <tr>
          <th scope="col" class="text-end">#</th>
          <th scope="col">Contract</th>
          <th scope="col" colspan="2" class="text-end">Terms</th>
          ${terms.map(
            (term, index) => html`<th scope="col" title="${term}" data-bs-toggle="tooltip">${index + 1}</th>`,
          )}
        </tr>
      </thead>
      <tbody>
        ${Object.entries(analysis.matches).map(([docName, row], docId) => {
          const hasTerms = Object.values(row).filter(Boolean).length;
          return html`
            <tr>
              <td class="text-end">${docId + 1}</td>
              <th scope="row">
                <a class="text-truncate d-inline-block doc-name" href="${app}/${docName}">${docName}</a>
              </th>
              <td>
                <div
                  class="progress mt-1"
                  role="progressbar"
                  aria-label="Has ${hasTerms} of ${terms.length} terms"
                  aria-valuenow="${hasTerms}"
                  aria-valuemin="0"
                  aria-valuemax="${terms.length}"
                  style="width: 100px"
                >
                  <div
                    class="progress-bar ${hasTerms > 0.9 * terms.length
                      ? "bg-success"
                      : hasTerms > 0.5 * terms.length
                        ? "bg-warning"
                        : "bg-danger"}"
                    style="width: ${(hasTerms / terms.length) * 100}%"
                  ></div>
                </div>
              </td>
              <td class="text-end text-nowrap">${hasTerms} / ${terms.length}</td>
              ${terms.map((term, termId) =>
                row[term]
                  ? html`<td data-doc-id="${docId}" data-term-id="${termId}" class="show-snippet cursor-pointer">
                      <i class="bi bi-check-square-fill text-success"></i>
                    </td>`
                  : row[term] === undefined
                    ? html`<td></td>`
                    : html`<td data-doc-id="${docId}" data-term-id="${termId}" class="show-snippet text-muted">
                        <i class="bi bi-x-square-fill text-danger"></i>
                      </td>`,
              )}
            </tr>
          `;
        })}
      </tbody>
    </table>
  `,
  $resultTable,
);

render(
  html`<option value="">(Choose a contract)</option>
    ${docs.map((doc) => html`<option value="${doc}">${doc}</option>`)}`,
  $contractFile,
);

// When #contract-file changes, load {app}/{doc} into #contract
$contractFile.addEventListener("change", async () => {
  const doc = $contractFile.value;
  if (!doc) return;
  $contract.value = await fetch(`${app}/${doc.replace(".pdf", ".txt")}`).then((r) => r.text());
});

// Set the contents of #terms to terms, one per line
$terms.textContent = terms.join("\n");

// When $contractForm is submitted, check the contract for each term and display the results
$contractForm.addEventListener("submit", (event) => {
  event.preventDefault();
  $contractForm.classList.add("was-validated");
  const contract = $contract.value;
  // Terms are key: value, one per line. Instead of colon, tab, period, or semicolon are fine
  const terms = $terms.value
    .split("\n")
    .map((d) => d.trim())
    .filter(Boolean);
  const schema = {
    type: "object",
    properties: Object.fromEntries(terms.map((term) => [term, { type: ["null", "array"], items: { type: "string" } }])),
    required: terms,
  };
  const tools = [{ type: "function", function: { name: "contract_terms", parameters: schema } }];
  const body = {
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          'Call contract_terms({...}) with values as ["EXACT section number only, e.g. 2.3", "VERBATIM citation (max 30 words)"] where the key is mentioned in the contract. If not covered, use `null`. For example:\n\n{"term1": ["2.3", "The parties agree to ..."], "term2": null, ...}',
      },
      { role: "user", content: [{ type: "text", text: "Contract text:\n\n" + "```\n" + contract.trim() + "\n```" }] },
    ],
    stream: true,
    stream_options: { include_usage: true },
    tool_choice: { type: "function", function: { name: "contract_terms" } },
    temperature: 0,
    tools,
  };
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}:contractanalysis` };
  const source = new SSE("https://llmfoundry.straive.com/openai/v1/chat/completions", {
    headers,
    payload: JSON.stringify(body),
    start: false,
  });
  let content = "";
  let args = "";
  let usage = null;
  source.addEventListener("message", (event) => {
    if (event.data == "[DONE]") return;
    const message = JSON.parse(event.data);
    const content_delta = message.choices?.[0]?.delta?.content;
    const args_delta = message.choices?.[0]?.delta?.tool_calls?.[0]?.function?.arguments;
    if (content_delta) content += content_delta;
    if (args_delta) args += args_delta;
    if (message.usage) usage = message.usage;
    drawAnalysis({ terms, content, args, usage });
  });
  render(html`<div class="spinner-border my-5" role="status"></div>`, $analysisTable);
  source.stream();
});

function drawAnalysis({ terms, content, args, usage }) {
  const originalArgs = args;
  args = parse(args || "{}");
  const analysis = [
    html`
      <div class="my-3">${content}</div>
      <table class="table table-sm table-hover">
        <thead>
          <tr>
            <th scope="col" class="text-end">#</th>
            <th scope="col"></th>
            <th scope="col">Term</th>
            <th scope="col" class="text-end">Section</th>
            <th scope="col">Snippet</th>
          </tr>
        </thead>
        <tbody>
          ${terms.map(
            (term, index) => html`
              <tr>
                <td class="text-end">${index + 1}</td>
                ${args[term] === undefined
                  ? html`<td><div class="spinner-border spinner-border-sm" role="status"></div></td>
                      <td>${term}</td>
                      <td colspan="2"></td>`
                  : args[term] === null
                    ? html`<td><i class="bi bi-x-square-fill text-danger"></i></td>
                        <td>${term}</td>
                        <td></td>
                        <td></td>`
                    : html`<td><i class="bi bi-check-square-fill text-success"></i></td>
                        <td>${term}</td>
                        <td class="text-end">${args[term][0]}</td>
                        <td>${args[term][1]}</td>`}
              </tr>
            `,
          )}
        </tbody>
      </table>
    `,
  ];
  if (usage)
    analysis.push(html`
      <div class="my-3 d-flex align-items-center">
        <div class="col fs-5">
          <strong>Cost</strong>: ${num((usage.prompt_tokens * 5) / 1e4 + (usage.completion_tokens * 15) / 1e4)} cents.
        </div>
        <div class="col text-end">
          <!-- Button to download "args" as JSON -->
          <a
            href="data:application/json,${encodeURIComponent(originalArgs)}"
            download="contract-terms.json"
            class="btn btn-primary"
            data-bs-toggle="tooltip"
            title="Download the analysis as JSON"
          >
            <i class="bi bi-download"></i>
            Download JSON
          </a>
          <!-- Button to copy "args" as JSON -->
          <button
            class="btn btn-primary"
            data-bs-toggle="tooltip"
            title="Copy the analysis as JSON"
            onclick="navigator.clipboard.writeText(${JSON.stringify(originalArgs)})"
          >
            <i class="bi bi-clipboard"></i>
            Copy JSON
          </button>
        </div>
      </div>
    `);

  render(analysis, $analysisTable);
}

const snippetModal = new bootstrap.Modal("#snippet-modal");

$resultTable.addEventListener("click", (e) => {
  const $showSnippet = e.target.closest(".show-snippet");
  if ($showSnippet) showModal($showSnippet.dataset);
});

let selectedCell = {};

function showModal({ docId, termId }) {
  Object.assign(selectedCell, { docId, termId });
  // Highlight the current selected cell
  $resultTable.querySelector(".selected-cell")?.classList?.remove?.("selected-cell");
  $resultTable.querySelector(`[data-doc-id="${docId}"][data-term-id="${termId}"]`).classList.add("selected-cell");
  // Show the document, term, snippet, etc. for the selected cell
  const doc = docs[docId];
  const term = terms[termId];
  const [section, snippet] = analysis.matches[doc]?.[term] ?? [];
  render(html`<span class="${section ? "text-success" : "text-danger"}">${term}</span>`, $snippetModalTitle);
  const body = [
    html`<p>
      <a class="fw-bol" href="${app}/${doc}" style="word-break:break-word">${doc}</a>
      ${section ? "covers the term" : "does not cover the term"}
      <strong>${term}</strong>.
    </p>`,
  ];
  if (section)
    body.push(
      html`<hr />
        <h2 class="h6">Section ${section}</h2>
        <p>${snippet}</p>`,
    );
  render(body, $snippetModalBody);
  snippetModal.show();
}
// When the modal is hidden, remove the selected-cell class
$snippetModal.addEventListener("hidden.bs.modal", () => {
  $resultTable.querySelector(".selected-cell")?.classList?.remove?.("selected-cell");
});

document.addEventListener("keydown", (event) => {
  if (!snippetModal._isShown) return;
  if (event.key === "ArrowLeft") selectedCell.termId = (+selectedCell.termId - 1 + terms.length) % terms.length;
  if (event.key === "ArrowRight") selectedCell.termId = (+selectedCell.termId + 1) % terms.length;
  if (event.key === "ArrowUp") selectedCell.docId = (+selectedCell.docId - 1 + docs.length) % docs.length;
  if (event.key === "ArrowDown") selectedCell.docId = (+selectedCell.docId + 1) % docs.length;
  showModal(selectedCell);
});

function chord() {
  const n = docs.length + terms.length;
  const index = new Map(docs.concat(terms).map((name, i) => [name, i]));
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const colors = [];

  docs.forEach((doc) => {
    terms.forEach((term) => {
      const docIndex = index.get(doc);
      const termIndex = index.get(term);
      if (matches[doc][term] !== undefined) {
        if (matches[doc][term]) {
          matrix[docIndex][termIndex] = 1;
          matrix[termIndex][docIndex] = 1;
          colors.push({ source: docIndex, target: termIndex, color: "var(--bs-success)" });
        } else {
          matrix[docIndex][termIndex] = 1; // To ensure connection
          matrix[termIndex][docIndex] = 1;
          colors.push({ source: docIndex, target: termIndex, color: "var(--bs-danger)" });
        }
      } else {
        matrix[docIndex][termIndex] = 1; // To ensure connection
        matrix[termIndex][docIndex] = 1;
        colors.push({ source: docIndex, target: termIndex, color: "var(--bs-danger)" });
      }
    });
  });

  const width = 960;
  const height = 960;
  const innerRadius = Math.min(width, height) * 0.5 - 250;
  const outerRadius = innerRadius + 10;

  const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  const ribbon = d3.ribbon().radius(innerRadius);
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const svg = d3.create("svg").attr("viewBox", [-width / 2, -height / 2, width, height]);
  const group = svg.append("g").selectAll("g").data(chord.groups).join("g");

  group
    .append("path")
    .attr("fill", (d) => color(d.index))
    .attr("stroke", (d) => d3.rgb(color(d.index)).darker())
    .attr("d", arc);

  const text = group
    .append("text")
    .each((d) => (d.angle = (d.startAngle + d.endAngle) / 2))
    .attr("dy", "0.35em")
    .attr(
      "transform",
      (d) =>
        `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerRadius + 5}) ${d.angle > Math.PI ? "rotate(180)" : ""}`,
    )
    .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : null))
    .attr("fill", "var(--bs-body-color)")
    .text((d) => docs.concat(terms)[d.index]);

  const ribbons = svg
    .append("g")
    .selectAll("path")
    .data(chord)
    .join("path")
    .attr("d", ribbon)
    .attr("fill", (d) => colors.find((c) => c.source === d.source.index && c.target === d.target.index).color);
  group.on("mouseover", (event, d) => {
    svg.classed("focus-mode", true);
    text.classed("active", (t) => {
      const linked = ribbons.data().filter((r) => r.source.index === d.index || r.target.index === d.index);
      return linked.some((r) => r.source.index === t.index || r.target.index === t.index);
    });
    text.attr(
      "fill",
      (t) =>
        colors.find(
          (c) => (c.source === d.index && c.target === t.index) || (c.target === d.index && c.source === t.index),
        )?.color ?? "var(--bs-body-color)",
    );
    group.classed("active", (t) => t.index === d.index);
    ribbons.classed("active", (r) => r.source.index === d.index || r.target.index === d.index);
  });
  group.on("mouseout", () => {
    svg.classed("focus-mode", false);
    group.classed("active", false);
    text.classed("active", false);
    text.attr("fill", "var(--bs-body-color)");
    ribbons.classed("active", false);
  });

  document.querySelector("#chord").appendChild(svg.node());
}
chord();

new bootstrap.Tooltip("body", { selector: '[data-bs-toggle="tooltip"]' });
