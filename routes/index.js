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
