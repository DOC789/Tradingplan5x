// Netlify Function: proxy langsung ke Yahoo Finance.
// Jalan di server Netlify, jadi tidak kena batasan CORS browser sama sekali.
// Endpoint akan tersedia di: /.netlify/functions/yahoo-price?ticker=BBRI.JK

exports.handler = async function (event) {
  const ticker = event.queryStringParameters && event.queryStringParameters.ticker;

  if (!ticker) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Parameter 'ticker' wajib diisi" }),
    };
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}`;

  try {
    const response = await fetch(yahooUrl, {
      headers: {
        // Beberapa endpoint Yahoo menolak request tanpa User-Agent browser
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Yahoo Finance merespons dengan status ${response.status}` }),
      };
    }

    const data = await response.json();
    const result = data && data.chart && data.chart.result && data.chart.result[0];
    const price = result && result.meta && result.meta.regularMarketPrice;

    if (!price || isNaN(price)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Ticker tidak ditemukan atau data tidak valid" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=15", // cache singkat 15 detik, cukup untuk harga live tanpa spam Yahoo
      },
      body: JSON.stringify({ ticker, price }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Gagal menghubungi Yahoo Finance", detail: err.message }),
    };
  }
};
