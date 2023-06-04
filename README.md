# bottom-lounge-chatbot
---

## About

**bottom-lounge-chatbot** is an OpenAI-powered chatbot configured for use on www.bottomlounge.com. It periodically scrapes information from the website for use in its responses.

---

## Client Installation

To install the chatbot on a website, add the following script and link tags to the bottom of the page's body, replacing `chatbotserver.tld` with the hostname of your chatbot server:
```html
    <!-- begin chatbot code -->
    <!-- use of defer makes script tag non-blocking -->
    <script
      defer
      src="https://chatbotserver.tld/assets/chatbot.js"
      type="module"
    ></script>
    <!-- media query hack to make css non-blocking -->
    <link
      rel="stylesheet"
      media="print"
      onload="this.onload=null;this.removeAttribute('media');"
      href="https://chatbotserver.tld/assets/chatbot.css"
    />
    <!-- end chatbot code -->
```
In order to work, the website's origin must be added to the `ALLOWED_ORIGINS` environment variable on the chatbot server. The chatbot will not work on any website that is not listed in `ALLOWED_ORIGINS`.

---

## Server Installation 

1. **Clone the repo** - `git clone https://github.com/fermentationist/bottom-lounge-chatbot.git`
2. **Install dependencies** - `cd bottom-lounge-chatbot`, then`npm install`
3. **Add environment variables** - Create a new `.env` file, with `touch .env`, or else by copying `sample.env` with `cp sample.env .env`. Then, add the required environment variables to the `.env` file. See the [Environment Variables](#environment-variables) section below for more information.
4. **Start the server** - `npm start`

### Environment Variables

**`SERVER_PORT`** - The port on which the server will listen for requests. Defaults to "4000".
**`DEV_SERVER_PORT`** - The port on which the dev server will listen for requests, if running in development mode. Defaults to "3000".
**`COOKIE_SECRET`** - (required) A random string of characters used to sign cookies. This can be any string of characters, but it should be kept secret.
**`OPENAI_API_KEY`** - (required) Your OpenAI API key. You can create an account at [OpenAI](https://platform.openai.com/). Once you have an account, you can create an API key on the [API settings page](https://platform.openai.com/account/api-keys).
**`ALLOWED_ORIGINS`** - (required) A comma-separated list of origins that are allowed to use the chatbot. The chatbot will not work on any website that is not listed in `ALLOWED_ORIGINS`.
**`URL_TO_SCRAPE`** - (required) The URL of the FAQ page the bot will scrape for information. Probably `https://www.bottomlounge.com/contact/`
**`BOT_NAME`** - A name for the chatbot, defaults to "Marvin"
**`VITE_BOT_HOST_URL`** - (required) The hostname of the chatbot server, used by the chatbot client to make requests. Like `https://chatbotserver.tld`
**`VITE_CHAT_WIDGET_TITLE`** - The title to display on the chat widget, defaults to "Welcome!".
**`VITE_BOT_GREETING`** - The greeting to display when the chat widget is opened, defaults to "Hello!"
**`BOT_INSTRUCTIONS`** - Instructions to be used in the chatbot's system prompt, to guide its behavior. Defaults to "The assistant is an AI chatbot. It is helpful, friendly, and informative."

---

### License

#### Copyright © 2023 [Dennis Hodges](https://dennis-hodges.com)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

Source: http://opensource.org/licenses/ISC