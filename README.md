# Discord Support Ticket Bot

This is a Discord bot that allows users to create support tickets through an interactive button. When the button is clicked, a private thread is created where the user and all members with the support role can communicate. Once the issue is resolved, the support team can click the "Resolve" button which archives the thread and logs the entire conversation as an HTML transcript into a specified log channel.

## Installation

To get started, clone the repository using the following command:

git clone https://github.com/Safe-Development/Discord-Basic-Ticket-System.git

Navigate into the project directory:

cd support-ticket-bot

Install the dependencies:

npm install

##Create a `.env` file in the root directory and add your Discord bot token and the support role ID:

##TOKEN=your-bot-token
##SUPPORT_ROLE_ID=your-support-role-id

##Then start the bot with:

node index.js

## Features

- Users can open support tickets by clicking a button.
- The bot creates a private thread named `ticket-username`.
- The user and all members of the support role are added to the thread.
- A language-specific welcome message is sent based on the selected type (English, Turkish, or Russian).
- The support team can resolve tickets by clicking the "Resolve" button inside the thread.
- The bot generates an HTML transcript containing all messages in the thread.
- The transcript and ticket summary are sent to a predefined log channel.
- Only the server owner can set the log channel using the `/support-log` command.
- Temporary transcript files are automatically deleted after being sent.

## Slash Commands

/support-log  
Sets the channel where ticket transcripts and logs will be sent. Only the server owner can use this command. It takes one required option: `channel`, which is the target log channel.

## Usage

To deploy a support message in a specific channel, use a custom slash command or trigger that executes the `/support` logic. Users will see a message with a "Support" button. When clicked, a thread is created and a welcome message is sent. The bot supports three languages via the `type` field: `type1` for English, `type2` for Turkish, and `type3` for Russian. When a support member resolves a ticket, the bot fetches the last 100 messages, builds an HTML transcript, sends it to the log channel with a detailed embed, archives the thread, and deletes the transcript file.

## Requirements

- Node.js v16.9.0 or higher
- Discord bot token
- A role ID for your support team

## Files

- `index.js`: Main bot logic
- `.env`: Contains the bot token and support role ID
- `transcript-*.html`: Temporary transcript files created during ticket resolution

## License

This project is licensed under the MIT License. You are free to modify and use it in your own servers.

