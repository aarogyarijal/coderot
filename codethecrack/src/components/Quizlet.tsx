import { useState, useEffect } from "react";
import "./styles.css";

type Question = {
    id: number;
    question: string;
    options: string[];
    correct: string;
    feedback: string;
};

function Quizlet() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [showSubmit, setShowSubmit] = useState(true);
  const [showNext, setShowNext] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (questions.length === 0)
        fetch("http://localhost:5000/questions")
        .then((response) => response.json())
        .then((data) => {setQuestions(data); console.log(data)})
        .catch((error) =>
            console.error("Failed fetching questions from API:/n", error)
        );
        
    });

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

  if (!questions.length) return <p>Loading...</p>;

  return (
    <div className="quiz-container">
      <h3>{questions[currentQuestion].question}</h3>
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
