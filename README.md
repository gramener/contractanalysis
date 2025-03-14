# Contract Analysis

A web application for analyzing legal contracts using AI to extract key information, identify clauses, and visualize relationships between contract elements.

![Contract Analysis Visualization](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Visualization_of_contract_clause_evaluations.gif/600px-Visualization_of_contract_clause_evaluations.gif)

## Features

- AI-powered contract analysis
- Extraction of key clauses and terms
- Interactive visualization of contract relationships
- Responsive design with dark/light mode support
- Secure authentication system
- Real-time analysis feedback

## Usage

1. Log in to the system
2. Upload or paste your contract text
3. Click "Analyze" to process the contract
4. View the results in the interactive dashboard

### Example Questions

You can ask the system questions about your contracts, such as:

- What are the key terms in this contract?
- Find all clauses related to termination
- Identify potential risks in this agreement
- Compare this contract with standard templates

## Setup

### Prerequisites

- Modern web browser with ES Modules support
- Web server for local development

### Local Setup

1. Clone this repository:

```bash
git clone https://github.com/gramener/contractanalysis.git
cd contractanalysis
```

2. Serve the files using any static web server. For example, using Python:

```bash
python -m http.server
```

3. Open `http://localhost:8000` in your web browser

## Deployment

On [Cloudflare DNS](https://dash.cloudflare.com), proxy CNAME `contractanalysis.straive.app` to `gramener.github.io`.

On this repository's [page settings](https://github.com/gramener/contractanalysis/settings/pages), set

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/`

## Technical Details

This application follows a client-side architecture with:

- [Bootstrap](https://getbootstrap.com) v5.3.3 - UI components
- [lit-html](https://lit.dev) v3 - Template rendering
- [D3.js](https://d3js.org/) v3 - Data visualization
- [partial-json](https://npmjs.com/package/partial-json) - JSON parsing
- [SSE.js](https://npmjs.com/package/sse.js) - Server-Sent Events
- [Gramex UI](https://npmjs.com/package/gramex-ui) - UI components
- Backend API: [LLM Foundry](https://llmfoundry.straive.com/)

## License

[MIT License](LICENSE)
