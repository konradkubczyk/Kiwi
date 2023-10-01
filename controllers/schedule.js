const axios = require('axios');
const https = require('https');
const xml2js = require('xml2js');
const ical = require('ical-generator');
const crypto = require('crypto');

class Schedule {
	/**
	 * Creates a new Schedule object
	 * @param {String} scheduleURL 
	 */
	constructor(properties) {
		this.properties = properties;
		// this.scheduleURL = scheduleURL + '&xml';
	}

	/**
	 * Gets XML data from schedule URL and returns it as JSON
	 * @param {String} scheduleURL URL of the schedule
	 * @returns {Promise} Calendar data in JSON format
	 */
	async #getData(scheduleURL) {
		const agent = axios.create({
			httpsAgent: new https.Agent({
				rejectUnauthorized: false
			})
		});

		let response;
		try {
			response = await agent.get(
				scheduleURL,
				{
					headers: {
						'Content-Type': 'application/xml'
					}
				}
			);
		} catch (error) {
			console.error(error);
			throw new Error('Error while fetching data');
		}

		const scheduleXML = response.data;

		try {
			const parser = new xml2js.Parser();
			const scheduleJSON = await parser.parseStringPromise(scheduleXML);
			return scheduleJSON;
		} catch (error) {

			// Use fallback URL if the main one does not provide valid data, replacing &okres=2 with &okres=1
			if (scheduleURL.includes('&okres=2')) {
				console.error('Could not parse data from response, trying fallback URL');
				return await this.#getData(scheduleURL.replaceAll('&okres=2', '&okres=1'));
			}

			console.error(error);
			throw new Error('Error while parsing data from response');
		}
	}

	/**
	 * Gets calendar data from schedule URL and returns it as ICS
	 * @returns {Promise} Calendar data in ICS format
	 */
	async getICS() {

		// Get data for main schedule
		let scheduleJSON = await this.#getData(`https://planzajec.uek.krakow.pl/index.php?typ=G&id=${this.properties.main.id}&okres=2&xml`);

		// Filter out events for ignored optional classes
		if (this.properties.ignored) {
			scheduleJSON['plan-zajec']['zajecia'] = scheduleJSON['plan-zajec']['zajecia'].filter(event => {
				return !(event['typ'] == 'ćwiczenia do wyboru' && this.properties.ignored.includes(event['przedmiot'][0]));
			});
		}

		// Get data for extra schedules and merge it with main schedule
		if (this.properties.extra) {

			// Filter out events with 'Przedmiot' starting with 'Język obcy'
			scheduleJSON['plan-zajec']['zajecia'] = scheduleJSON['plan-zajec']['zajecia'].filter(event => {
				return !event['przedmiot'][0].startsWith('Język obcy');
			});

			for (const extraSchedule of this.properties.extra) {
				const extraScheduleJSON = await this.#getData(`https://planzajec.uek.krakow.pl/index.php?typ=N&id=${extraSchedule.id}&okres=2&xml`);

				// Filter out events from other groups
				extraScheduleJSON['plan-zajec']['zajecia'] = extraScheduleJSON['plan-zajec']['zajecia'].filter(event => {
					return event['grupa'][0] === extraSchedule.group;
				});

				// Add teacher to every event from the schedule name as organizer in the format used in other schedules
				for (const event of extraScheduleJSON['plan-zajec']['zajecia']) {
					event['nauczyciel'] = [{ '_': extraScheduleJSON['plan-zajec']['$']['nazwa'].split(',').reverse().join(' ').trim() }];
				}

				// Merge extra schedule with main schedule
				scheduleJSON['plan-zajec']['zajecia'] = scheduleJSON['plan-zajec']['zajecia'].concat(extraScheduleJSON['plan-zajec']['zajecia']);
			}
		}

		let events;
		try {
			events = scheduleJSON['plan-zajec']['zajecia'];
		} catch (error) {
			console.error(error);
			throw new Error('Error while trying to get events from parsed data');
		}

		// Sort events by start date and time
		events.sort((a, b) => {
			const aDate = new Date(a['termin'][0] + 'T' + a['od-godz'][0] + ':00');
			const bDate = new Date(b['termin'][0] + 'T' + b['od-godz'][0] + ':00');
			return aDate - bDate;
		});

		try {
			const calendar = new ical({
				name: 'Plan zajęć ' + scheduleJSON['plan-zajec']['$']['nazwa'],
				timezone: 'Europe/Warsaw',
				ttl: 60 * 60 * 12,
				prodId: {
					company: 'UEK',
					product: 'Plan zajęć',
					language: 'PL'
				},
				source: 'https://planzajec.uek.krakow.pl'
			});

			for (const event of events) {
				calendar.createEvent({
					id: crypto.createHash('md5').update(
						event['typ'][0] + event['przedmiot'][0] + event['termin'][0] + event['od-godz'][0] + event['do-godz'][0] + event['sala'][0]
					).digest('hex'),
					summary: event['typ'][0].charAt(0).toUpperCase() + event['typ'][0].slice(1) + ' | ' + event['przedmiot'][0],
					start: new Date(
						event['termin'][0] + 'T' + event['od-godz'][0] + ':00'
					),
					end: new Date(
						event['termin'][0] + 'T' + event['do-godz'][0].split(' ')[0] + ':00'
					),
					location: event['sala'][0].match(/<a href="(.*)">.*<\/a>/) ? event['sala'][0].match(/<a href="(.*)">.*<\/a>/)[1] : event['sala'][0],
					description: event['typ'][0].charAt(0).toUpperCase() + event['typ'][0].slice(1) + '\n' + event['nauczyciel'].map(organizer => organizer['_']).join(', ')
				});
			}

			const scheduleICS = calendar.toString();

			return scheduleICS;
		} catch (error) {
			console.error(error);
			throw new Error('Error while creating ICS data');
		}
	}
}

module.exports = Schedule;