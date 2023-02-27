# 🥝 Kiwi

## 📕 About

Kiwi is an open-source on-demand XML to ICS schedule transcriber, created to make it easier to add external schedules to personal calendars through subscription URLs. It currently works only with select schedules from a single source, as the app was created as a small project with an individual use case in mind.

## 🤔 How it works

Kiwi acts like a middleman - when your calendar app requests current event information, Kiwi fetches the necessary information from an external schedule source, which it then processes to compose an ICS file. This file is then served as a response. In case of an issue, the app responds with a text hinting towards the error's source.

## 🔗 Useful links

If you are interested in the project and would like to learn more or help make it better, these links may help:

- [Releases](https://gitlab.com/konradkubczyk/kiwi/-/releases) - access information and resources regarding successive releases of the app.
- [Issues](https://gitlab.com/konradkubczyk/kiwi/-/issues) - you can post about any issues or bugs you encounter here.
- [Marge requests](https://gitlab.com/konradkubczyk/kiwi/-/merge_requests) - contributions are always welcome.
