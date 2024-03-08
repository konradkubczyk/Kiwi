const express = require('express');
const router = express.Router();

const Schedule = require('../controllers/schedule');

// GET home page
router.get('/', function (req, res) {
    const appDomain = req.get('host');

    res.render('index', { appDomain });
});

// GET /* (all other routes)
router.get('/*', async function (req, res) {

    if (!req.query.id) {
        return res.status(400).send('Missing id parameter');
    }

    let scheduleIds;
    let groupNames;
    let scheduleProperties = {};

    // Get schedule id(s) from request
    try {
        scheduleIds = req.query.id.split(',');
    } catch (error) {
        console.error(error);
        return res.status(400).send('Invalid or missing id parameter');
    }

    // Prevent parsing of too many schedules (limit to 3)
    if (scheduleIds.length > 3) {
        console.error('Attempted to parse too many schedules');
        return res.status(400).send('Attempted to parse too many schedules');
    }

    // Add main schedule id to schedule properties while removing it from schedule ids
    scheduleProperties.main = {
        id: scheduleIds.shift()
    };

    // Check whether the id parameter has more values
    if (scheduleIds.length) {

        // Get group names from request
        try {
            groupNames = req.query.group.split(',');
        } catch (error) {
            console.error(error);
            return res.status(400).send('Invalid or missing group parameter');
        }

        // Check if group names are provided in the same amount as remaining schedule ids
        if (groupNames.length !== scheduleIds.length) {
            console.error('Invalid amount of groups');
            return res.status(400).send('Invalid amount of groups');
        }

        // Add extra schedules ids and group names to schedule properties
        scheduleProperties.extra = [];
        for (let i = 0; i < scheduleIds.length; i++) {
            scheduleProperties.extra.push({
                id: scheduleIds[i],
                group: groupNames[i]
            });
        }
    }

    // Get ignored classes names
    if (req.query.ignore) {
        try {
            scheduleProperties.ignored = req.query.ignore.split(',');
        } catch (error) {
            console.error(error);
            return res.status(400).send('Invalid ignored classes parameter');
        }
    }

    if (req.query.compact !== undefined) {
        scheduleProperties.compact = true;
    }

    if (req.query.reverse !== undefined) {
        scheduleProperties.reverse = true;
    }

    // Create schedule object
    const schedule = new Schedule(scheduleProperties);

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
