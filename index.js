const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

app.get('/scrape', async (req, res) => {
  const aid = req.query.aid;
  if (!aid) return res.status(400).send("Missing 'aid' query parameter");

  const url = `https://www.athletic.net/athlete/${aid}/track-and-field/all`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      const meets = [];
      const rows = document.querySelectorAll('table tbody tr');

      rows.forEach(row => {
        const event = row.querySelector('.event')?.textContent?.trim();
        const mark = row.querySelector('.mark')?.textContent?.trim();
        const meetName = row.querySelector('.meet-name')?.textContent?.trim();
        const date = row.querySelector('.meet-date')?.textContent?.trim();

        if (event && mark) {
          meets.push({ event, mark, meetName, date });
        }
      });

      return meets.slice(0, 5); // limit to 5 most recent
    });

    await browser.close();
    res.json({ aid, results: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scraping failed', message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Scraper running on port ${PORT}`));
