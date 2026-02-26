# 📥 ESE Welcomer

A professional, fully configurable welcome system for **Open Ticket v4**. Automatically greet new members with a beautiful embed and custom message content.

## ✨ Features
* **Custom Embeds:** Full control over titles, descriptions, colors, and footers.
* **Dynamic Placeholders:** Use `{user}` and `{server}` to personalize messages.
* **Admin Commands:** Test your setup or reload changes without restarting the bot.
* **Console Logging:** Keeps track of admin actions with a clean, color-coded log.

---

## ⚙️ Configuration
The `config.json` file can be found in `./plugins/ese-welcomer/`. Below is a breakdown of every available option:

### 📍 General Settings
| Key | Description | Format |
| :--- | :--- | :--- |
| `welcomeChannelId` | The ID of the Discord channel where the welcome message will be posted. | 18+ digits |
| `testTitle` | A text prefix shown only when using the `/welcome test` command. | String |
| `messageContent` | The text message sent outside/above the embed. | String |

### 🖼️ Embed Settings
| Key | Description | Format |
| :--- | :--- | :--- |
| `embed.author.name` | Small text at the very top of the embed. | String |
| `embed.author.icon` | URL to a small image next to the author name. | URL |
| `embed.title` | The main bold title of the embed. | String |
| `embed.description` | The main body text of the welcome message. | String |
| `embed.color` | The side-strip color in Hex format. | Hex (#ff8c00) |
| `embed.thumbnail` | Image in the top-right. Set to `"user-icon"` for the member's avatar, or a URL. | "user-icon" / URL |
| `embed.image` | A large banner image at the bottom. | URL |
| `embed.footer` | Small text at the bottom of the embed. | String |
| `embed.timestamp` | Shows the exact time the user joined. | Boolean (true/false) |

---

## 🏷️ Placeholders
You can use these tags in almost any string field (titles, descriptions, footers, etc.):
* `{user}`: Mentions the new member (e.g., @Eseclick).
* `{server}`: Displays the name of your Discord server.

---

## 🛠️ Commands
These commands require **Administrator** permissions within the Open Ticket system.

* `/welcome test` - Sends a preview of your welcome message (visible only to you).
* `/welcome reload` - Reloads the `config.json` file so you don't have to restart the bot after making changes.

---

## 📥 Installation
1. Download the plugin folder.
2. Place the `ese-welcomer` folder inside your Open Ticket `plugins` directory.
3. Configure your `welcomeChannelId` in `config.json`.
4. Restart your bot.

---

## 📝 Example Config
```json
{
    "welcomeChannelId": "YOUR_CHANNEL_ID",
    "testTitle": "This is your welcome embed preview:\n\n",
    "messageContent": "Welcome {user} to {server}!",
    "embed": {
        "author": {
            "name": "New member in {server}",
            "icon": "",
            "url": ""
        },
        "title": "Welcome to the server!",
        "description": "Hey {user}! 👋\n\nYou are now part of our community.\nWe hope you have an amazing time here!",
        "color": "#ff8c00",
        "thumbnail": "user-icon",
        "image": "",
        "footer": "ESE Welcomer | {server}",
        "timestamp": true
    }
}