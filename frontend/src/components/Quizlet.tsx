import { useState, useEffect } from "react";
import "./styles.css";

type Question = {
    id: number;
    question: string;
    options: string[];
    correct: string;
    feedback: string;
    totalAttempts: number;
    correctAttempts: number;
};

function Quizlet() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [showSubmit, setShowSubmit] = useState(true);
  const [showNext, setShowNext] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
        fetch("http://localhost:5000/questions")
        .then((response) => response.json())
        .then((data) => {setQuestions(data); console.log(data)})
        .catch((error) =>
            console.error("Failed fetching questions from API:/n", error)
        );
    },[]);

  function handleSubmit(): void {
    if(selectedOption == ""){
        setFeedback("Select an Option!");
        return;
    }
    console.log("Submitting!")
    fetch("http://localhost:5000/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionID: questions[currentQuestion].id,
        answer: selectedOption
    })
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setQuestions(prevQuestions => 
          prevQuestions.map(q =>
            q.id === questions[currentQuestion].id ? 
              { ...q, totalAttempts: data.totalAttempts, correctAttempts: data.correctAttempts } 
              : q
          )
        )

        if (data.correct) {
            setFeedback("Correct!");
        }else{
            setFeedback(data.feedback);
        }
        setShowNext(true);
        setShowSubmit(false);
      })
      .catch((error) => {
        console.error("Failed checking answer:\n", error);
        setFeedback("Internal Server Error! Try Again.");
      });
  }

  function handleNextQuestion(): void {
    setSelectedOption("");
    setFeedback("");
    setCurrentQuestion((prev) => (prev + 1) % questions.length);
    setShowNext(false);
    setShowSubmit(true);
  }

  function handleOptionClick(option: string): void {
    if (showSubmit) setSelectedOption(option);
    else {
      setFeedback("Click below to go to the next question!");
    }
  }

  function getSuccessRateColor(correctAttempts: number, totalAttempts: number): string {
    if (totalAttempts === 0) return "gray"; // Default color when no attempts
  
    const successRate = (correctAttempts * 100) / totalAttempts;
  
    if (successRate < 40) return "red";       // Low success rate (Red)
    if (successRate < 70) return "orange";    // Medium success rate (Orange/Yellow)
    return "green";                           // High success rate (Green)
  }

  if (!questions.length) return <p>Loading...</p>;

  return (
    <div className="quiz-container">
      <h3>{questions[currentQuestion].question}</h3>
      <div>
      <p 
        className="success-rate" 
        style={{
          color: getSuccessRateColor(questions[currentQuestion].correctAttempts, questions[currentQuestion].totalAttempts)
        }}
      >
      Success Rate: ≈  
      {questions[currentQuestion].totalAttempts > 0 
      ? ((questions[currentQuestion].correctAttempts * 100) / questions[currentQuestion].totalAttempts)
      : 0}%
      </p>
      </div>
      <ul>
        {questions[currentQuestion].options.map((option, index) => (
          <li
            id={selectedOption === option ? "selectedOption" : ""}
            key={index}
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </li>
        ))}
      </ul>
      {feedback && <p>{feedback}</p>}
      {showSubmit && <button onClick={() => handleSubmit()}>Submit</button>}
      {showNext && <button onClick={() => handleNextQuestion()}>Next</button>}
    </div>
  );
}

export default Quizlet;
