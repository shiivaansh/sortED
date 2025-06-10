# SortED Student Platform with AI Integration

A comprehensive student management platform enhanced with AI capabilities for personalized learning experiences.

## Features

### Core Features
- **Dashboard**: Overview of academic progress and activities
- **Attendance Tracking**: Monitor and visualize attendance patterns
- **Assignment Management**: Track assignments with status and deadlines
- **GPA Predictor**: Calculate and predict academic performance
- **Events**: Manage and register for school events
- **Messages**: Group communication and messaging
- **LearnCenter**: Access learning resources and materials

### AI-Powered Features
- **AI Study Assistant**: Interactive chatbot for study help
- **Assignment Helper**: AI-powered assignment assistance and planning
- **Learning Recommendations**: Personalized content suggestions
- **Smart Scheduler**: AI-optimized study schedule planning
- **Enhanced GPA Predictor**: Advanced predictions using custom AI model

## AI Integration

### Your Custom GPA Prediction Model
The platform is designed to integrate with your Python-based GPA prediction service. The AI service expects the following endpoints:

#### Required Endpoints

1. **POST /predict-gpa**
   ```json
   {
     "subjects": [
       {
         "name": "Mathematics",
         "currentGrade": 85.5,
         "creditHours": 3,
         "difficulty": "hard"
       }
     ],
     "targetGPA": 9.0,
     "currentSemester": 3,
     "studyHoursPerWeek": 20
   }
   ```

2. **POST /study-assistant**
   ```json
   {
     "message": "Can you help me with calculus?",
     "context": {
       "subject": "Mathematics",
       "topic": "Calculus"
     },
     "conversationHistory": []
   }
   ```

3. **POST /assignment-help**
   ```json
   {
     "assignmentTitle": "Physics Lab Report",
     "subject": "Physics",
     "description": "Lab report on motion analysis",
     "dueDate": "2024-01-25",
     "currentProgress": "Completed data collection"
   }
   ```

4. **POST /learning-recommendations**
   ```json
   {
     "studentProfile": {
       "subjects": ["Mathematics", "Physics"],
       "learningStyle": "visual",
       "currentGPA": 8.5,
       "weakAreas": ["Calculus"],
       "interests": ["Science", "Technology"]
     }
   }
   ```

5. **POST /optimize-schedule**
   ```json
   {
     "assignments": [
       {
         "id": "1",
         "title": "Math Assignment",
         "subject": "Mathematics",
         "dueDate": "2024-01-25",
         "estimatedHours": 4,
         "priority": 8
       }
     ],
     "availableHours": [
       {
         "day": "Monday",
         "startTime": "14:00",
         "endTime": "18:00"
       }
     ],
     "preferences": {
       "preferredStudyTimes": ["14:00-18:00"],
       "breakDuration": 15,
       "maxSessionLength": 120
     }
   }
   ```

6. **GET /health** - Health check endpoint

### Setting Up Your AI Service

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your AI service details:
   ```
   REACT_APP_AI_SERVICE_URL=http://localhost:8000
   REACT_APP_AI_API_KEY=your_api_key_here
   ```

2. **Python Service Setup**
   Your Python service should run on the configured URL (default: `http://localhost:8000`) and implement the endpoints listed above.

3. **CORS Configuration**
   Make sure your Python service allows CORS requests from the frontend:
   ```python
   from flask_cors import CORS
   
   app = Flask(__name__)
   CORS(app, origins=["http://localhost:5173"])  # Vite dev server
   ```

### Mock Responses
The platform includes mock responses for all AI features, so you can test the UI before connecting your actual AI service. The mock responses demonstrate the expected data structure and help with development.

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sorted-student-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Update .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Usage

### Accessing AI Features

1. **AI Hub**: Navigate to the AI Hub from the sidebar to access all AI-powered features
2. **Study Assistant**: Get instant help with your studies through the interactive chatbot
3. **Assignment Helper**: Get AI assistance for assignment planning and execution
4. **Learning Recommendations**: Receive personalized content suggestions based on your profile
5. **Smart Scheduler**: Optimize your study schedule with AI recommendations
6. **Enhanced GPA Predictor**: Use advanced AI predictions for academic planning

### Integration Status

The platform shows the current AI service status in the AI Hub. When your Python service is not connected, it will use mock responses and display a warning indicator.

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: React Router DOM
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Icons**: Lucide React
- **Build Tool**: Vite

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── AIStudyAssistant.tsx
│   ├── AIAssignmentHelper.tsx
│   ├── AILearningRecommendations.tsx
│   └── AISmartScheduler.tsx
├── pages/              # Page components
│   ├── AIHub.tsx
│   ├── EnhancedGPAPredictor.tsx
│   └── ...
├── services/           # API services
│   └── aiService.ts    # AI service integration
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Adding New AI Features

1. **Define the API interface** in `src/services/aiService.ts`
2. **Create the component** in `src/components/`
3. **Add to AI Hub** in `src/pages/AIHub.tsx`
4. **Update types** in `src/types/index.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.