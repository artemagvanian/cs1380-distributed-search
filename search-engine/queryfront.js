const readline = require('readline');
const natural = require('natural');
const axios = require('axios');
const cheerio = require('cheerio');
const distribution = require('../config.js');
const utils = require('./utils.js');
const nodeConfig = require('./node_config.json');
const open = require('open').default;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'search> '
});

let activeResults = null;
let currentPage = 0;
const pageSize = 10;

async function getGeneralSummary(url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const html = response.data;
    const $ = cheerio.load(html);
    let summary = "";
    let times = 0;
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 0 && times == 1) {
        summary = text;
        return false;
      } else if (text.length > 0) {
        times++;
      }
    });
    if (!summary) {
      summary = "Summary unavailable.";
    }

    const requestedSentenceCount = 3;
    const sentenceRegex = /[^.!?]*[.!?](\s|$)/g;
    let match;
    let sentences = [];
    while ((match = sentenceRegex.exec(summary)) !== null && sentences.length < requestedSentenceCount) {
      sentences.push(match[0].trim());
    }
    if (sentences.length > 0) {
      summary = sentences.join(' ');
    }

    return summary;
  } catch (err) {
    console.error(`Error fetching general summary for ${url}:`, err);
    return "Summary unavailable.";
  }
}

async function getSummary(url) {
  return await getGeneralSummary(url);
}

async function displayPage() {
  if (!activeResults) {
    console.log("No active search results.");
    rl.prompt();
    return;
  }
  const totalPages = Math.ceil(activeResults.length / pageSize);
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  if (currentPage < 0) currentPage = 0;

  const start = currentPage * pageSize;
  const pageResults = activeResults.slice(start, start + pageSize);

  console.log(`\nShowing results page ${currentPage + 1} of ${totalPages}:`);

  const summaries = await Promise.all(pageResults.map(result => getSummary(result.url)));

  pageResults.forEach((result, index) => {
    const globalIndex = start + index + 1;
    console.log(`${globalIndex}. ${result.url} (score: ${result.score.toFixed(3)})`);
    console.log(`   Summary: ${summaries[index]}`);
  });

  console.log("\nEnter result number to open, 'n' for next page, 'p' for previous page, or type a new search query:");
  rl.prompt();
}

function resetSearchState(results) {
  activeResults = results;
  currentPage = 0;
}

function queryFunction(query) {
  const term = natural.PorterStemmer.stem(query.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase());
  const config = { gid: 'search' };
  const group = utils.mkGroupFromConfig(nodeConfig);
  
  distribution.local.groups.put(config, group, (e) => {
    utils.perror(e);
    const tfRequest = { service: 'search', method: 'queryTF' };

    distribution.search.comm.send([term], tfRequest, (e, tfs) => {
      if (e && Object.keys(e).length !== 0) {
        for (const node in e) {
          global.distribution.util.log(`${node}: ${e[node]}`, 'error');
        }
      }
      const idfRequest = { service: 'search', method: 'queryIDF' };

      distribution.search.comm.send([term], idfRequest, (e, idfs) => {
        if (e && Object.keys(e).length !== 0) {
          for (const node in e) {
            global.distribution.util.log(`${node}: ${e[node]}`, 'error');
          }
        }

        let nDocuments = 0;
        let nOccurrences = 0;
        for (const node in idfs) {
          const [documentsPerNode, occurrencesPerNode] = idfs[node];
          nDocuments += documentsPerNode;
          nOccurrences += occurrencesPerNode;
        }

        const results = [];
        for (const node in tfs) {
          for (const url in tfs[node]) {
            const score = tfs[node][url] * Math.log10(nDocuments / nOccurrences);
            results.push({ url, score });
          }
        }

        results.sort((a, b) => b.score - a.score);

        if (results.length === 0) {
          console.log('No results found.');
          rl.prompt();
          return;
        }

        resetSearchState(results);
        displayPage();
      });
    });
  });
}

distribution.node.start((server) => {
  rl.prompt();

  rl.on('line', (line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.toLowerCase() === 'exit') {
      rl.close();
      server.close();
      return;
    }

    if (activeResults) {
      if (trimmedLine.toLowerCase() === 'n') {
        const totalPages = Math.ceil(activeResults.length / pageSize);
        if (currentPage < totalPages - 1) {
          currentPage++;
          displayPage();
          return;
        } else {
          console.log("Already at the last page.");
          rl.prompt();
          return;
        }
      } else if (trimmedLine.toLowerCase() === 'p') {
        if (currentPage > 0) {
          currentPage--;
          displayPage();
          return;
        } else {
          console.log("Already at the first page.");
          rl.prompt();
          return;
        }
      } else if (!isNaN(parseInt(trimmedLine))) {
        const chosenIndex = parseInt(trimmedLine);
        if (chosenIndex > 0 && chosenIndex <= activeResults.length) {
          const chosenResult = activeResults[chosenIndex - 1];
          open(chosenResult.url)
            .catch(err => console.error('Failed to open url:', err));
          rl.prompt();
          return;
        }
      }
      activeResults = null;
    }

    if (trimmedLine) {
      queryFunction(trimmedLine);
    } else {
      rl.prompt();
    }
  }).on('close', () => {
    server.close();
    console.log('Exiting search REPL.');
    process.exit(0);
  });
});
