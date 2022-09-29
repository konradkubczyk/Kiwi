const express = require('express');
const router = express.Router();

const Schedule = require('../controllers/schedule');

// GET home page
router.get('/', function (req, res, next) {
  const appDomain = req.get('host');

  res.render('index', { appDomain });
});

// GET /* (all other routes)
router.get('/*', async function (req, res, next) {
  
  // Get schedule URL from request and while changing protocol to https
  let scheduleURL = 'https://' + req.originalUrl.slice(1).replace(/(^\w+:|^)\/\//, '');

  // List of supported schedule sources' domains
  const allowedDomains = [
    'planzajec.uek.krakow.pl'
  ];

  // Check if schedule URL is from supported domain
  try {
    const domain = new URL(scheduleURL).hostname;

    if (!allowedDomains.includes(domain)) {
      return res.status(400).send('Invalid domain, allowed domains: ' + allowedDomains.join(', '));
    }
  } catch (error) {
    console.error(error);
    return res.status(400).send('Invalid URL');
  }

  // Create schedule object
  const schedule = new Schedule(scheduleURL);

  // Get calendar data in ICS format
  try {
    const ics = await schedule.getICS();

    res.set('Content-Type', 'text/calendar');

    // Set filename for calendar file
    res.attachment('schedule.ics');

    res.send(ics);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error while fetching data and generating calendar');
  }
});

module.exports = router;
