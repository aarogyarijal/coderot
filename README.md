# **Quizlet App (MCQ Quiz System) 📚🧠**

A simple multiple-choice question (MCQ) quiz application built with **React** (frontend) and **Node.js with Express & Sequelize** (backend). The app allows users to attempt quiz questions, tracks their success rate, and dynamically updates statistics in a PostgreSQL database.

## **Features 🚀**
✅ Fetches questions from a PostgreSQL database using Sequelize ORM.  
✅ Tracks **total attempts** and **correct attempts** per question.  
✅ Displays **success rate** with dynamic color coding:  
   - **Red** for low success rate (<40%)  
   - **Orange/Yellow** for medium success rate (40%-70%)  
   - **Green** for high success rate (>70%)  
✅ RESTful API with Express.js for handling requests.  
✅ Cross-Origin Resource Sharing (**CORS**) support for frontend-backend communication.  

---

## **Tech Stack 🛠️**

### **Frontend** (React + TypeScript)
- React with TypeScript  
- CSS for styling  
- Fetch API for communicating with the backend  

### **Backend** (Node.js + Express)
- Express.js for REST API  
- Sequelize ORM for database interaction  
- PostgreSQL for data storage  
- CORS middleware  

---

## **Installation & Setup 🏗️**

### **1. Clone the Repository**
```sh
git clone https://github.com/your-username/quizlet-app.git
cd quizlet-app
```

### **2. Setup the Backend**
```sh
cd backend
npm install
npm seed  # Seeds database with questions from questions.json
npm start
```

### **2. Setup the Frontend**
```sh
cd frontend
npm install
npm run dev
```