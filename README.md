# 🛡 BaridiGuard Bot

**BaridiGuard** is a specialized Telegram bot designed for the Algerian community to combat scams and build trust in **BaridiMob (CCP/RIP)** transactions. It acts as a reputation layer for RIP numbers, allowing users to check, report, and vouch for accounts before sending money.

---

## 🌟 Key Features

### For Users
- **🔍 RIP Verification**: Check if a BaridiMob RIP (20 digits) is trustworthy before you send money.
- **🚨 Report Scams**: Submit reports about fraudulent accounts with screenshots as evidence.
- **✅ Vouch for Merchants**: Recommend trusted sellers and help them build their reputation.
- **🔔 RIP Owner Notifications**: Get instantly notified if someone reports or recommends your account!
- **📊 Personal Statistics**: View your trust score, stats, and complete reporting history.
- **🇩🇿 Localized Experience**: Fully optimized in Algerian Darja and Arabic.

### For Admins
- **📬 Automatic Report Forwarding**: All reports are forwarded to a central admin ID for moderation.
- **✅ Approve/Reject System**: Moderate reports directly from the Telegram interface.
- **🔍 Quick RIP View**: Instantly access detailed RIP profiles from report notifications.
- **🤖 Suspicious Activity Alerts**: Automated monitoring for potential abuse.

---

## 📱 Bot Commands

| Command | Description |
| :--- | :--- |
| `/start` | Start the bot and register |
| `/check <RIP>` | Check the risk/reputation of a 20-digit RIP |
| `/report` | Submit a scam report or a positive recommendation |
| `/profile` | View your trust score, stats, and registered RIP |
| `/myreports` | See a history of the reports you've submitted |
| `/stats` | View global community statistics |
| `/about` | Learn about the BaridiGuard project |
| `/help` | Show all available commands |

---

## 🛡️ Smart Features

### **1. RIP Owner Notifications**
If you enter your correct RIP during registration, you'll receive a notification whenever someone mentions your account. This allows you to track your standing or dispute false reports instantly.

### **2. Reporting Limits**
- **Once Per RIP**: Each account can only report a specific RIP *once* (ever) to prevent spamming.
- **24h Cooldown**: To ensure quality reports, users can only submit *one report every 24 hours* across the platform.

### **3. Dynamic Risk Engine**
- **Weighted Scoring**: High-trust users have more influence on the risk score.
- **Time Decay**: Reports lose their impact over time (50% validity every 6 months), allowing users to redeem their reputation.
- **Positive Weighting**: Recommendations have a strong positive impact, encouraging good behavior.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Cloud/Atlas)
- A [Telegram Bot Token](https://t.me/BotFather)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/elhadjx/baridiguard.git
   cd BaridiGuard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   *Required Variables:*
   - `BOT_TOKEN`: Your Telegram bot token.
   - `MONGO_URI`: Your MongoDB connection string.
   - `ADMIN_TELEGRAM_ID`: Your personal Telegram ID for moderation features.

### Running the Bot

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

---

## 🤝 Contributing & Collaboration

We want **BaridiGuard** to be a community-driven project. Whether you are a developer, a designer, or a security researcher, your help is welcome!

Check out our [CONTRIBUTING.md](CONTRIBUTING.md) to get started with:
- Fixing bugs or improving the code.
- Adding new features or localizations.
- Enhancing the documentation.

---

## 🔒 Privacy & Security

We take user privacy seriously. We only store the minimum information required for the bot to function and for the community to be safe (Telegram ID, Phone, and RIP). All data is handled with care and respect for privacy.

---

## 📞 Contact

For support or questions, reach out to:
- **Telegram**: [@elhadjx](https://t.me/elhadjx)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

صنع بـ ❤️ في الجزائر 🇩🇿
