const axios = require('axios');
const https = require('https');
const xml2js = require('xml2js');
const ical = require('ical-generator');

class Schedule {
  /**
   * Creates a new Schedule object
   * @param {String} scheduleURL 
   */
  constructor(scheduleURL) {
    this.scheduleURL = scheduleURL + '&xml';
  }

  /**
   * Gets XML data from schedule URL and returns it as JSON
   * @returns {Promise} Calendar data in JSON format
   */
  async #getData() {
    const agent = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    let response;
    try {
      response = await agent.get(
        this.scheduleURL,
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
      console.error(error);
      throw new Error('Error while parsing data from response');
    }
  }

  /**
   * Gets calendar data from schedule URL and returns it as ICS
   * @returns {Promise} Calendar data in ICS format
   */
  async getICS() {
    const scheduleJSON = await this.#getData();

    let events;
    try {
      events = scheduleJSON['plan-zajec']['zajecia'];
    } catch (error) {
      console.error(error);
      throw new Error('Error while trying to get events from parsed data');
    }

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
        source: this.scheduleURL
      });

      for (const event of events) {
        calendar.createEvent({
          summary: event['przedmiot'][0],
          start: new Date(
            event['termin'][0] + 'T' + event['od-godz'][0] + ':00'
          ),
          end: new Date(
            event['termin'][0] + 'T' + event['do-godz'][0].split(' ')[0] + ':00'
          ),
          location: event['sala'][0],
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