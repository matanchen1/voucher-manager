# 🎫 Voucher Manager

A modern, full-stack web application for managing gift cards and service vouchers with partial usage tracking, built with React and Node.js.

![Voucher Manager](https://img.shields.io/badge/React-18.x-61dafb?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-06b6d4?logo=tailwindcss)

## ✨ Features

### 🎯 Core Functionality
- **Gift Card Management**: Track monetary vouchers with partial spending
- **Service Voucher Tracking**: Manage one-time use service vouchers
- **Current Amount Display**: Visual progress bars showing remaining balance
- **Partial Usage**: Specify exact amounts to spend from gift cards
- **Usage History**: Track all transactions with dates and notes

### 🔍 Smart Filtering & Search
- **Quick Filters**: One-click filters for Supermarkets and McDonald's
- **Advanced Search**: Search by code, store, or description
- **Category & Status Filters**: Filter by type, category, and expiration status
- **Real-time Updates**: Instant filtering as you type

### 💡 User Experience
- **Progress Bars**: Visual indication of remaining balance
- **Quick Amount Buttons**: Fast selection (50, 100, 200 NIS)
- **Usage Indicators**: Shows number of times vouchers have been used
- **Mobile Responsive**: Works perfectly on all devices
- **Modern UI**: Clean, intuitive interface with Tailwind CSS

### 📊 Dashboard & Analytics
- **Overview Statistics**: Total vouchers, active amounts, expiring soon
- **Status Tracking**: Active, expiring, expired, and used vouchers
- **Company & Category Stats**: Track vouchers by store and category

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/coupon-manager.git
   cd coupon-manager
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   cd frontend
   npm install
   
   # Backend dependencies
   cd ../backend
   npm install
   ```

3. **Start the development servers**

   **Backend** (Terminal 1):
   ```bash
   cd backend
   node server-dev.js
   ```
   Server will run on `http://localhost:3001`

   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```
   App will open on `http://localhost:3000`

## 🏗️ Project Structure

```
coupon-manager/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                 # Node.js Express backend
│   ├── server-dev.js       # Development server with mock data
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🎮 Usage Examples

### Adding a New Voucher
1. Click "Add Voucher" button
2. Choose voucher type (Gift Card or Service Voucher)
3. Fill in details (code, store, amount/description)
4. Add category and expiration date
5. Save voucher

### Using a Gift Card
1. Click "Use" on any active gift card
2. Enter the amount you want to spend
3. Use quick buttons (50, 100, 200) or enter custom amount
4. Add notes about where you used it
5. Confirm usage

### Quick Filtering
- Click "🛒 Supermarkets" to see all grocery store vouchers
- Click "🍟 McDonalds" to see McDonald's vouchers only
- Use the search bar for specific codes or stores

## 🧪 Sample Data

The development server includes sample vouchers:
- **SP500**: Super Pharm gift card (500 NIS, partially used)
- **RL200**: Rami Levy supermarket voucher (200 NIS, unused)
- **SHP150**: Shufersal supermarket voucher (150 NIS, partially used)
- **IKEA300**: IKEA home voucher (300 NIS, partially used)
- **MCD50**: McDonald's voucher (50 NIS, partially used)
- **SPA100**: Aria Spa service voucher (massage treatment)

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **CORS** for cross-origin requests
- **Helmet** for security
- **UUID** for unique IDs
- **Mock data** for development

## 📱 Features in Detail

### Voucher Types
- **Gift Cards**: Monetary vouchers that can be partially spent
- **Service Vouchers**: One-time use vouchers for specific services

### Smart Status System
- **Active**: Ready to use
- **Expiring**: Expires within 7 days
- **Expired**: Past expiration date
- **Used**: Fully consumed or marked as used

### Usage Tracking
- Complete transaction history
- Amount tracking for gift cards
- Notes for each usage
- Automatic status updates

## 🚀 Future Enhancements

- [ ] PostgreSQL database integration
- [ ] User authentication and accounts
- [ ] Voucher sharing between users
- [ ] Mobile app version
- [ ] Barcode scanning
- [ ] Export/import functionality
- [ ] Advanced analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Matan** - [GitHub Profile](https://github.com/yourusername)

---

⭐ **Star this repo if you found it helpful!** 